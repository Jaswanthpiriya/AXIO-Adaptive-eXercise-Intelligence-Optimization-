/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Personal AI Assistant — Voice Auto-Submission & Recognition Tests
 */

import {
  startAssistantSpeechRecognition,
  cleanTextForAssistantSpeech,
} from '../src/utils/assistantVoice.ts';
import { parseAssistantCommand } from '../src/utils/assistantActionRegistry.ts';

// Mock MockStorage for Node.js test environment
class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Mock Web Speech Recognition class
class MockSpeechRecognition {
  lang: string = 'en-US';
  continuous: boolean = true;
  interimResults: boolean = true;
  maxAlternatives: number = 1;

  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  private isStarted: boolean = false;

  start() {
    this.isStarted = true;
    setTimeout(() => {
      if (this.onstart) this.onstart();
    }, 0);
  }

  stop() {
    this.isStarted = false;
    setTimeout(() => {
      if (this.onend) this.onend();
    }, 0);
  }

  abort() {
    this.isStarted = false;
    setTimeout(() => {
      if (this.onerror) this.onerror({ error: 'aborted' });
      if (this.onend) this.onend();
    }, 0);
  }

  // Test helpers to simulate speech events
  simulateSpeechEvent(results: { transcript: string; isFinal: boolean }[], resultIndex = 0) {
    if (this.onresult) {
      const formattedResults = results.map((r) => [
        { transcript: r.transcript },
      ]);
      results.forEach((r, idx) => {
        (formattedResults[idx] as any).isFinal = r.isFinal;
      });
      this.onresult({
        resultIndex,
        results: formattedResults,
      });
    }
  }

  simulateError(errorName: string) {
    if (this.onerror) {
      this.onerror({ error: errorName });
    }
  }
}

// Attach mocks to global environment
(global as any).localStorage = new MockStorage();
(global as any).sessionStorage = new MockStorage();
(global as any).window = {
  SpeechRecognition: MockSpeechRecognition,
  speechSynthesis: {
    speak: () => true,
    cancel: () => true,
    getVoices: () => [],
  },
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log('=== AXIO PERSONAL AI VOICE AUTO-SUBMIT TEST SUITE ===\n');

async function runTests() {
  // -------------------------------------------------------------------------
  // TEST 1: Auto-submit on speech completion: "Open my dashboard"
  // -------------------------------------------------------------------------
  console.log('Test 1: Auto-submission of "Open my dashboard"...');
  {
    let finalUtteranceCount = 0;
    let submittedTranscript = '';

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 200, // short for test
      onFinalUtterance: (transcript) => {
        finalUtteranceCount++;
        submittedTranscript = transcript;
      },
    });

    assert(session !== null, 'Recognition session initialized');
    await sleep(20);

    // Simulate final speech "Open my dashboard"
    session!.recognition.simulateSpeechEvent([
      { transcript: 'Open my dashboard', isFinal: true },
    ]);

    // Wait for silence timeout
    await sleep(250);

    assert(finalUtteranceCount === 1, 'Utterance submitted exactly once');
    assert(submittedTranscript === 'Open my dashboard', 'Transcribed text matches');

    // Parse through action registry
    const parsed = parseAssistantCommand(submittedTranscript);
    assert(parsed.type === 'navigate' && parsed.targetPageId === 'dashboard', 'Action maps to dashboard navigation');
  }

  // -------------------------------------------------------------------------
  // TEST 2: Auto-submit: "Open my nutrition plan"
  // -------------------------------------------------------------------------
  console.log('\nTest 2: Auto-submission of "Open my nutrition plan"...');
  {
    let finalUtteranceCount = 0;
    let submittedTranscript = '';

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 200,
      onFinalUtterance: (transcript) => {
        finalUtteranceCount++;
        submittedTranscript = transcript;
      },
    });

    await sleep(20);
    session!.recognition.simulateSpeechEvent([
      { transcript: 'Open my nutrition plan', isFinal: true },
    ]);

    await sleep(250);

    assert(finalUtteranceCount === 1, 'Submitted once on silence completion');
    assert(submittedTranscript === 'Open my nutrition plan', 'Nutrition transcript matches');

    const parsed = parseAssistantCommand(submittedTranscript);
    assert(
      (parsed.type === 'open_nutrition_plan' || parsed.type === 'navigate') &&
        parsed.targetPageId === 'nutrition',
      'Action maps to nutrition plan'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 3: Auto-submit: "Show my progress"
  // -------------------------------------------------------------------------
  console.log('\nTest 3: Auto-submission of "Show my progress"...');
  {
    let submittedTranscript = '';

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 200,
      onFinalUtterance: (transcript) => {
        submittedTranscript = transcript;
      },
    });

    await sleep(20);
    session!.recognition.simulateSpeechEvent([
      { transcript: 'Show my progress', isFinal: true },
    ]);

    await sleep(250);

    assert(submittedTranscript === 'Show my progress', 'Progress transcript matches');
    const parsed = parseAssistantCommand(submittedTranscript);
    assert(
      (parsed.type === 'show_progress' || parsed.type === 'navigate') &&
        parsed.targetPageId === 'progress',
      'Action maps to progress page'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 4: Longer sentence with pauses between words (no premature submit)
  // -------------------------------------------------------------------------
  console.log('\nTest 4: Pause handling between words without premature submission...');
  {
    let submissions: string[] = [];

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 300,
      onFinalUtterance: (transcript) => {
        submissions.push(transcript);
      },
    });

    await sleep(20);

    // First word with interim result
    session!.recognition.simulateSpeechEvent([
      { transcript: 'Show', isFinal: true },
    ]);

    // Brief pause (100ms < 300ms silenceTimeout)
    await sleep(100);
    assert(submissions.length === 0, 'Did not submit prematurely during 100ms pause');

    // Second word
    session!.recognition.simulateSpeechEvent(
      [
        { transcript: 'Show', isFinal: true },
        { transcript: "today's completed exercises", isFinal: true },
      ],
      1
    );

    // Wait for full silence timeout (350ms)
    await sleep(350);

    assert(submissions.length === 1, 'Submitted exactly once after complete sentence');
    assert(
      submissions[0] === "Show today's completed exercises",
      `Combined sentence captured: "${submissions[0]}"`
    );

    const parsed = parseAssistantCommand(submissions[0]);
    assert(
      parsed.type === 'show_completed_exercises',
      'Parsed as show_completed_exercises action'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 5: Say nothing / empty speech (no submission)
  // -------------------------------------------------------------------------
  console.log('\nTest 5: Say nothing - empty transcript must NOT be submitted...');
  {
    let submissionMade = false;

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 200,
      onFinalUtterance: () => {
        submissionMade = true;
      },
    });

    await sleep(20);

    // Simulate empty result or whitespace
    session!.recognition.simulateSpeechEvent([
      { transcript: '   ', isFinal: true },
    ]);

    await sleep(250);

    // Simulate recognition end
    session!.recognition.stop();
    await sleep(50);

    assert(!submissionMade, 'No submission made for whitespace/empty speech');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Cancel / abort microphone (no unintended command executed)
  // -------------------------------------------------------------------------
  console.log('\nTest 6: Cancel microphone - ensure no command is executed...');
  {
    let submissionMade = false;

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 300,
      onFinalUtterance: () => {
        submissionMade = true;
      },
    });

    await sleep(20);

    // User starts saying something
    session!.recognition.simulateSpeechEvent([
      { transcript: 'Start my workout', isFinal: true },
    ]);

    // But user clicks Cancel before timeout
    session!.cancel();

    await sleep(400);

    assert(!submissionMade, 'Cancel prevented execution of command');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Deduplication guarantee (end event + timeout only submits once)
  // -------------------------------------------------------------------------
  console.log('\nTest 7: Deduplication guarantee (both timeout and onend)...');
  {
    let count = 0;

    const session = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 150,
      onFinalUtterance: () => {
        count++;
      },
    });

    await sleep(20);

    session!.recognition.simulateSpeechEvent([
      { transcript: 'Open exercises', isFinal: true },
    ]);

    // Trigger onend at the same time as silence timeout
    await sleep(150);
    session!.recognition.stop();
    await sleep(50);

    assert(count === 1, `Utterance processed exactly once (count=${count})`);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Consequential action confirmation safety
  // -------------------------------------------------------------------------
  console.log('\nTest 8: Consequential actions safety (Finish Workout)...');
  {
    const finishParsed = parseAssistantCommand('Finish my workout');
    assert(finishParsed.type === 'finish_workout', 'Parsed as finish_workout');
    assert(
      finishParsed.requiresConfirmation === true,
      'Finish workout strictly requires confirmation'
    );

    const markAllParsed = parseAssistantCommand("Mark today's nutrition plan as completed");
    assert(markAllParsed.type === 'mark_all_nutrition_completed', 'Parsed as mark_all_nutrition_completed');
    assert(
      markAllParsed.requiresConfirmation === true,
      'Mark all meals strictly requires confirmation'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 9: Ambiguous command asks clarification
  // -------------------------------------------------------------------------
  console.log('\nTest 9: Ambiguity protection & clarification question...');
  {
    const ambig = parseAssistantCommand('workout');
    assert(ambig.type === 'ambiguous', 'Bare "workout" flagged as ambiguous');
    assert(
      Boolean(ambig.clarificationQuestion),
      'Clarification question returned to user'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 10: Official AXI identity & error messaging
  // -------------------------------------------------------------------------
  console.log('\nTest 10: Official AXI identity & natural error messages...');
  {
    let receivedError = '';
    const session = startAssistantSpeechRecognition({
      onError: (msg) => {
        receivedError = msg;
      },
    });

    session!.recognition.simulateError('no-speech');
    await sleep(20);
    assert(receivedError.includes('AXI'), 'No-speech error clearly identifies AXI');

    session!.recognition.simulateError('not-allowed');
    await sleep(20);
    assert(receivedError.includes('AXI'), 'Permission-denied error clearly identifies AXI');
  }

  console.log(`\n=== ALL TESTS FINISHED: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

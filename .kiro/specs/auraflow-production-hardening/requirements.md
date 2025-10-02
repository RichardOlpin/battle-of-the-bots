# Requirements Document

## Introduction

This specification defines the production hardening requirements for AuraFlow's AI services and the implementation of new core features: Gentle Nudge notifications and Affirmation systems. The goal is to make all AI services resilient to edge cases, malformed inputs, and unexpected user behavior, while adding compassionate user guidance features through the Chrome Extension.

This work builds upon the existing AI integration services (Smart Scheduling, Ritual Generation, and Session Summaries) and extends the Chrome Extension with persistent notification capabilities using Chrome APIs.

## Requirements

### Requirement 1: Harden Smart Scheduling Service

**User Story:** As a developer, I want the Smart Scheduling Service to handle all edge cases gracefully, so that the system never crashes regardless of input quality.

#### Acceptance Criteria

1. WHEN calendarEvents input is null or undefined THEN the system SHALL treat it as an empty array and proceed normally
2. WHEN an event object is missing startTime or endTime THEN the system SHALL ignore that specific event and continue processing
3. WHEN an event has endTime before startTime THEN the system SHALL ignore that malformed event
4. WHEN multiple events overlap (e.g., 2-3 PM and 2:30-3:30 PM) THEN the system SHALL merge them into a single busy block (2-3:30 PM)
5. WHEN an all-day event is present THEN the system SHALL interpret it as blocking the entire workday (9 AM to 5 PM)
6. WHEN userPreferences object is missing or incomplete THEN the system SHALL apply sensible defaults (preferredTime: 'morning', minimumDuration: 75)
7. WHEN any edge case is handled THEN the system SHALL NOT throw an error or crash

### Requirement 2: Harden Ritual Generation Service

**User Story:** As a developer, I want the Ritual Generation Service to always return a valid ritual object, so that users never experience errors when requesting rituals.

#### Acceptance Criteria

1. WHEN context object is null or undefined THEN the system SHALL return the default balanced ritual without error
2. WHEN context.calendarEventTitle is an empty string THEN the system SHALL fall back to default logic path
3. WHEN context.calendarEventTitle is null or undefined THEN the system SHALL fall back to default logic path
4. WHEN context.timeOfDay contains unexpected values THEN the system SHALL use default value 'morning'
5. WHEN context.calendarDensity contains unexpected values THEN the system SHALL use default value 'moderate'
6. WHEN any invalid context property is encountered THEN the system SHALL NOT throw an error
7. WHEN edge cases are handled THEN the system SHALL always return a complete ritual object with all required properties

### Requirement 3: Implement Gentle Nudge Notification System

**User Story:** As a user, I want to receive timely notifications during my focus sessions, so that I'm guided through work and break periods even when the extension popup is closed.

#### Acceptance Criteria

1. WHEN implementing notifications THEN the system SHALL use chrome.alarms API for persistence
2. WHEN a focus session starts THEN popup.js SHALL send a message to background.js containing workDuration and breakDuration
3. WHEN background.js receives session start message THEN it SHALL clear any previously existing alarms
4. WHEN creating alarms THEN the system SHALL create AURAFLOW_WORK_END alarm set to trigger in workDuration minutes
5. WHEN creating alarms THEN the system SHALL create AURAFLOW_BREAK_END alarm set to trigger in workDuration + breakDuration minutes
6. WHEN an alarm fires THEN chrome.alarms.onAlarm listener SHALL check the alarm name and trigger appropriate notification
7. WHEN triggering notifications THEN the system SHALL use chrome.notifications API
8. WHEN user clicks "End Session" early THEN popup.js SHALL send message to background.js to clear all scheduled alarms
9. WHEN alarms are cleared early THEN no notifications SHALL appear after session end

### Requirement 4: Implement Affirmation and Mindfulness Breaks

**User Story:** As a user, I want to receive compassionate, encouraging messages during my breaks, so that I feel supported and motivated throughout my focus sessions.

#### Acceptance Criteria

1. WHEN implementing affirmations THEN background.js SHALL define a constant array named AFFIRMATIONS
2. WHEN defining affirmations THEN the array SHALL contain at least 10 unique encouraging messages
3. WHEN AURAFLOW_WORK_END alarm fires THEN the notification title SHALL be "AuraFlow: Time for a mindful break!"
4. WHEN AURAFLOW_WORK_END alarm fires THEN the notification message SHALL be a randomly selected affirmation from AFFIRMATIONS array
5. WHEN selecting affirmations THEN the system SHALL use random selection to provide variety
6. WHEN displaying affirmations THEN messages SHALL be compassionate and encouraging in tone
7. WHEN notifications appear THEN they SHALL include both title and affirmation message

### Requirement 5: Comprehensive Unit Test Coverage for Hardening

**User Story:** As a developer, I want comprehensive unit tests for all edge cases, so that I can verify the hardening logic works correctly and prevent regressions.

#### Acceptance Criteria

1. WHEN testing scheduling service THEN tests SHALL verify null/undefined input handling
2. WHEN testing scheduling service THEN tests SHALL verify malformed event handling (missing times, invalid times)
3. WHEN testing scheduling service THEN tests SHALL verify overlapping event merging logic
4. WHEN testing scheduling service THEN tests SHALL verify all-day event handling
5. WHEN testing scheduling service THEN tests SHALL verify missing preferences default application
6. WHEN testing ritual service THEN tests SHALL verify null/undefined context handling
7. WHEN testing ritual service THEN tests SHALL verify empty/null title handling
8. WHEN testing ritual service THEN tests SHALL verify invalid context property handling
9. WHEN all tests run THEN they SHALL pass without errors

### Requirement 6: End-to-End Testing Documentation

**User Story:** As a QA tester, I want detailed test cases for all new features and edge cases, so that I can manually verify the system works correctly in real-world scenarios.

#### Acceptance Criteria

1. WHEN updating test documentation THEN the system SHALL add "Test Case B3: Scheduling with Overlapping and Malformed Events"
2. WHEN Test Case B3 is documented THEN it SHALL detail setup with overlapping events and one broken event
3. WHEN Test Case B3 is documented THEN it SHALL verify correct time suggestion despite malformed data
4. WHEN updating test documentation THEN the system SHALL add "Test Case C3: Ritual Generation with Null Input"
5. WHEN Test Case C3 is documented THEN it SHALL detail how to simulate null input scenario
6. WHEN Test Case C3 is documented THEN it SHALL verify default ritual is returned
7. WHEN updating test documentation THEN the system SHALL add "Test Case E1: Verify Session Notifications"
8. WHEN Test Case E1 is documented THEN it SHALL provide steps to start short (1-minute) focus session
9. WHEN Test Case E1 is documented THEN it SHALL verify notification appears after popup is closed
10. WHEN updating test documentation THEN the system SHALL add "Test Case E2: Verify Early Session End"
11. WHEN Test Case E2 is documented THEN it SHALL provide steps to start and immediately end session
12. WHEN Test Case E2 is documented THEN it SHALL verify no notification appears after early termination

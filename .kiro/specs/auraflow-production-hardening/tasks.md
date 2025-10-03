# Implementation Plan

- [x] 1. Harden Smart Scheduling Service with edge case handling
  - [x] 1.1 Add input normalization for null/undefined calendar events
    - Modify suggestOptimalFocusWindow to call normalizeCalendarEventsInput at the start
    - Implement normalizeCalendarEventsInput function that returns empty array for null/undefined
    - Handle non-array inputs by returning empty array with console warning
    - _Requirements: 1.1_
  
  - [x] 1.2 Implement overlapping event merger
    - Create mergeOverlappingEvents function that consolidates overlapping time blocks
    - Sort events by start time before merging
    - Merge events where nextStart <= currentEnd
    - Extend current event end time to cover merged events
    - _Requirements: 1.4_
  
  - [x] 1.3 Add all-day event expansion logic
    - Create expandAllDayEvent function to detect date-only events
    - Expand all-day events to block 9 AM - 5 PM workday hours
    - Mark expanded events with isAllDay flag
    - Apply expansion before event validation
    - _Requirements: 1.5_
  
  - [x] 1.4 Enhance malformed event filtering
    - Update event validation to check for missing startTime/endTime
    - Add check for endTime before startTime (invalid time range)
    - Filter out invalid events without throwing errors
    - Log warnings for skipped malformed events
    - _Requirements: 1.2, 1.3_
  
  - [x] 1.5 Apply default user preferences
    - Create preference normalization function
    - Set default preferredTime to 'morning' if missing
    - Set default minimumDuration to 75 if missing
    - Set default bufferTime to 15 if missing
    - _Requirements: 1.6_

- [x] 2. Write comprehensive unit tests for hardened scheduling service
  - [x] 2.1 Test null/undefined input handling
    - Write test: 'should handle null calendarEvents'
    - Write test: 'should handle undefined calendarEvents'
    - Write test: 'should handle missing userPreferences'
    - Verify function returns valid result without crashing
    - _Requirements: 5.1_
  
  - [x] 2.2 Test malformed event handling
    - Write test: 'should ignore events without startTime'
    - Write test: 'should ignore events without endTime'
    - Write test: 'should ignore events with endTime before startTime'
    - Verify function processes remaining valid events
    - _Requirements: 5.2_
  
  - [x] 2.3 Test overlapping event merging
    - Write test: 'should merge two overlapping events'
    - Write test: 'should merge multiple overlapping events'
    - Write test: 'should not merge non-overlapping events'
    - Verify merged events create single busy block
    - _Requirements: 5.3_
  
  - [x] 2.4 Test all-day event handling
    - Write test: 'should block workday for all-day events'
    - Write test: 'should expand date-only events to 9-5'
    - Verify all-day events prevent scheduling during work hours
    - _Requirements: 5.4_
  
  - [x] 2.5 Test missing preferences defaults
    - Write test: 'should apply default preferredTime'
    - Write test: 'should apply default minimumDuration'
    - Write test: 'should apply default bufferTime'
    - Verify defaults are used when preferences missing
    - _Requirements: 5.5_

- [ ] 3. Harden Ritual Generation Service with edge case handling
  - [ ] 3.1 Add context normalization
    - Create normalizeRitualContext function
    - Handle null/undefined context by returning default context object
    - Handle non-object context by returning default context object
    - Normalize individual properties (title, timeOfDay, calendarDensity)
    - _Requirements: 2.1, 2.2_
  
  - [ ] 3.2 Implement property normalization helpers
    - Create normalizeString function for calendarEventTitle
    - Create normalizeTimeOfDay function with valid value checking
    - Create normalizeCalendarDensity function with valid value checking
    - Return sensible defaults for invalid values
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [ ] 3.3 Update main function to use normalization
    - Call normalizeRitualContext at start of generatePersonalizedRitual
    - Extract normalized values from returned context
    - Continue with existing decision tree logic
    - Ensure function never throws errors
    - _Requirements: 2.6, 2.7_

- [ ] 4. Write comprehensive unit tests for hardened ritual service
  - [ ] 4.1 Test null/undefined context handling
    - Write test: 'should return balanced ritual for null context'
    - Write test: 'should return balanced ritual for undefined context'
    - Write test: 'should return balanced ritual for non-object context'
    - Verify default ritual is returned
    - _Requirements: 5.6_
  
  - [ ] 4.2 Test empty/null title handling
    - Write test: 'should handle empty string title'
    - Write test: 'should handle null title'
    - Write test: 'should handle undefined title'
    - Verify function falls back to density/time logic
    - _Requirements: 5.7_
  
  - [ ] 4.3 Test invalid context properties
    - Write test: 'should handle invalid timeOfDay values'
    - Write test: 'should handle invalid calendarDensity values'
    - Write test: 'should handle non-string property types'
    - Verify defaults are applied for invalid values
    - _Requirements: 5.8_

- [x] 5. Implement Gentle Nudge notification system in Chrome Extension
  - [x] 5.1 Add affirmations collection to background.js
    - Create AFFIRMATIONS constant array at top of background.js
    - Add at least 12 unique compassionate affirmation messages
    - Implement getRandomAffirmation function using Math.random()
    - Test affirmation selection returns different messages
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [x] 5.2 Implement session state management
    - Create SessionState object with saveSession, getSession, clearSession methods
    - Use chrome.storage.local to persist session data
    - Store workDuration, breakDuration, startTime, taskGoal
    - Implement error handling for storage operations
    - _Requirements: 3.2_
  
  - [x] 5.3 Implement alarm management system
    - Create AlarmManager object with alarm name constants
    - Implement clearAllAlarms method using chrome.alarms.clear
    - Implement createSessionAlarms method with workDuration and breakDuration
    - Create AURAFLOW_WORK_END alarm with delayInMinutes
    - Create AURAFLOW_BREAK_END alarm with combined duration
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 5.4 Implement alarm event listener
    - Add chrome.alarms.onAlarm.addListener in background.js
    - Check alarm.name to determine which alarm fired
    - For AURAFLOW_WORK_END: select random affirmation and create notification
    - For AURAFLOW_BREAK_END: create completion notification and clear session
    - Use chrome.notifications.create with type 'basic'
    - _Requirements: 3.6, 3.7, 4.3, 4.4_
  
  - [x] 5.5 Add session control message handlers
    - Add 'startSession' case to chrome.runtime.onMessage listener
    - Validate workDuration and breakDuration parameters
    - Call SessionState.saveSession with session data
    - Call AlarmManager.createSessionAlarms
    - Return success response to popup
    - _Requirements: 3.2, 3.3_
  
  - [x] 5.6 Add early session termination handler
    - Add 'endSession' case to chrome.runtime.onMessage listener
    - Call AlarmManager.clearAllAlarms to cancel pending alarms
    - Call SessionState.clearSession to remove session data
    - Return success response to popup
    - _Requirements: 3.8, 3.9_

- [x] 6. Integrate Gentle Nudge system with popup UI
  - [x] 6.1 Add session start function to popup.js
    - Create startFocusSession function accepting workDuration, breakDuration, taskGoal
    - Send 'startSession' message to background service worker
    - Handle success response by updating UI to show active session
    - Handle errors gracefully with user-friendly messages
    - _Requirements: 3.2_
  
  - [x] 6.2 Add session end function to popup.js
    - Create endFocusSession function
    - Send 'endSession' message to background service worker
    - Handle success response by updating UI to show session ended
    - Handle errors gracefully
    - _Requirements: 3.8_
  
  - [x] 6.3 Wire up UI event listeners
    - Add event listener for "Start Session" button
    - Add event listener for "End Session" button
    - Extract session parameters from UI inputs
    - Call appropriate session control functions
    - _Requirements: 3.2, 3.8_

- [x] 7. Update manifest.json with required permissions
  - Add "alarms" permission for chrome.alarms API
  - Add "notifications" permission for chrome.notifications API
  - Verify "storage" permission already exists
  - Test extension loads without permission errors
  - _Requirements: 3.1, 3.7_

- [x] 8. Create end-to-end testing documentation
  - [x] 8.1 Add Test Case B3: Scheduling with Overlapping and Malformed Events
    - Document setup with 2 overlapping events (2-3 PM and 2:30-3:30 PM)
    - Add 1 malformed event with missing startTime
    - Document expected behavior: system suggests valid time slot
    - Document verification: check response includes startTime and endTime
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 8.2 Add Test Case C3: Ritual Generation with Null Input
    - Document how to test with null context using browser dev tools
    - Provide code snippet: `generatePersonalizedRitual(null)`
    - Document expected behavior: returns balanced ritual
    - Document verification: check ritual has all required properties
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [x] 8.3 Add Test Case E1: Verify Session Notifications
    - Document steps to start 1-minute focus session
    - Document step to close popup window
    - Document expected notification after 1 minute with affirmation
    - Document expected second notification after break duration
    - Document verification: check notification title and message content
    - _Requirements: 6.7, 6.8, 6.9_
  
  - [x] 8.4 Add Test Case E2: Verify Early Session End
    - Document steps to start 5-minute focus session
    - Document step to immediately click "End Session"
    - Document step to close popup and wait 5+ minutes
    - Document expected behavior: no notifications appear
    - Document verification: confirm no system notifications
    - _Requirements: 6.10, 6.11, 6.12_

- [x] 9. Run all tests and verify production readiness
  - Run all unit tests for scheduling service: `npm test scheduling.service.test.js`
  - Run all unit tests for ritual service: `npm test ritual.service.test.js`
  - Verify all tests pass without errors
  - Execute manual Test Cases B3, C3, E1, E2 from documentation
  - Document any issues found and resolve before completion
  - _Requirements: 5.9, 6.1-6.12_

- [x] 10. Final integration and documentation
  - Verify all edge cases are handled gracefully without crashes
  - Test notification system with various session durations
  - Verify affirmations display correctly in notifications
  - Update END_TO_END_TESTING_GUIDE.txt with all new test cases
  - Commit all changes with descriptive commit messages
  - _Requirements: 1.7, 2.6, 2.7, 3.9, 4.6, 4.7, 5.9, 6.1-6.12_

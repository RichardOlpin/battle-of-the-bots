# Implementation Plan - Focus Session Experience

- [ ] 1. Create session screen UI structure
  - Add session-screen div to popup.html with timer display, controls, and soundscape selector
  - Add session header with title and close button
  - Add timer container with large display and phase indicator
  - Add task goal display area
  - Add pause/resume and end session buttons
  - Add soundscape dropdown and volume slider
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 2. Implement core timer logic
  - [ ] 2.1 Create session state management
    - Define sessionState object with isActive, isPaused, phase, timeRemaining, ritual, taskGoal
    - Implement startSession() function to initialize and show session screen
    - Implement updateTimer() function with setInterval for countdown
    - Implement formatTime() helper to convert seconds to MM:SS format
    - _Requirements: 1.3, 1.4, 4.3_
  
  - [ ] 2.2 Implement phase switching
    - Create switchPhase() function to toggle between work and break
    - Update UI to show current phase (work/break)
    - Reset timer for new phase duration
    - Send message to background for notification
    - _Requirements: 1.4, 3.1, 3.4_
  
  - [ ] 2.3 Implement pause/resume functionality
    - Create pauseSession() to stop interval and update button
    - Create resumeSession() to restart interval
    - Toggle button text between "Pause" and "Resume"
    - Update session state accordingly
    - _Requirements: 1.6_
  
  - [ ] 2.4 Implement end session functionality
    - Create endSession() to stop timer and audio
    - Clear session state from storage
    - Return to events screen
    - Clean up all intervals and audio
    - _Requirements: 1.7, 4.5_

- [ ] 3. Implement ambient soundscape engine
  - [ ] 3.1 Create audio management system
    - Create audioEngine object with play(), stop(), setVolume() methods
    - Define soundscapes object mapping names to file paths
    - Implement audio loop functionality
    - Handle audio cleanup on session end
    - _Requirements: 2.3, 2.5, 2.6_
  
  - [ ] 3.2 Wire up soundscape controls
    - Add event listener for soundscape dropdown
    - Add event listener for volume slider
    - Call audioEngine.play() when soundscape selected
    - Call audioEngine.setVolume() when slider moved
    - Stop audio when "None" selected
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ] 3.3 Add sound files
    - Create sounds/ directory in auraflow-extension
    - Add rain.mp3 file (royalty-free rain ambience)
    - Add cafe.mp3 file (royalty-free cafe ambience)
    - Verify files are under 5MB each
    - _Requirements: 2.1_

- [ ] 4. Implement notification system
  - [ ] 4.1 Create affirmation library
    - Define AFFIRMATIONS array with 10 compassionate messages
    - Ensure all messages use non-judgmental, supportive language
    - Create getRandomAffirmation() helper function
    - _Requirements: 3.2, 3.3_
  
  - [ ] 4.2 Implement notification functions in background.js
    - Create showBreakNotification() using chrome.notifications API
    - Create showWorkNotification() for break end
    - Include random affirmation in break notification
    - Use extension icon for notification icon
    - _Requirements: 3.1, 3.4, 3.5, 3.6_
  
  - [ ] 4.3 Wire up notification triggers
    - Send message from popup.js to background when work phase ends
    - Send message when break phase ends
    - Handle messages in background.js message listener
    - Trigger appropriate notification based on phase
    - _Requirements: 3.1, 3.4_

- [ ] 5. Implement state persistence
  - [ ] 5.1 Create storage functions
    - Implement saveSessionState() to save to chrome.storage.local
    - Implement loadSessionState() to restore on popup open
    - Implement clearSessionState() to remove on session end
    - Save state every 10 seconds during active session
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [ ] 5.2 Implement session restoration
    - Check for active session on popup load
    - Restore session screen if session active
    - Resume timer from saved timeRemaining
    - Restore ritual data and task goal
    - _Requirements: 4.2, 4.3_

- [ ] 6. Integrate with ritual generation
  - [ ] 6.1 Add "Start Session" button to ritual results
    - Modify displayRitualResult() to include Start Session button
    - Add event listener for Start Session button
    - Pass ritual data to startSession() function
    - Prompt user for task goal before starting
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 6.2 Configure timer from ritual data
    - Use ritual.workDuration for work phase timer
    - Use ritual.breakDuration for break phase timer
    - Display ritual.name as session title
    - Show ritual.description in UI
    - _Requirements: 5.3, 5.4_

- [ ] 7. Style session screen
  - Add CSS for session-screen layout
  - Style timer display with large, readable font
  - Add color coding for work (blue) and break (green) phases
  - Style soundscape controls
  - Add animations for timer countdown and phase transitions
  - Ensure responsive design for different popup sizes
  - Add dark mode support
  - _Requirements: 1.1, 1.2_

- [ ] 8. Add permissions to manifest.json
  - Add "notifications" permission for chrome.notifications API
  - Verify "storage" permission already exists
  - Test that notifications work without additional user prompts
  - _Requirements: 3.5, 3.6_

- [ ] 9. Update END_TO_END_TESTING_GUIDE.txt
  - Add test section for Focus Session Timer
  - Add test section for Soundscape Engine
  - Add test section for Notifications
  - Add test section for State Persistence
  - Include step-by-step verification instructions
  - Add troubleshooting section for common issues
  - _Requirements: All_

- [ ] 10. Final integration testing
  - Test complete flow: Generate Ritual → Start Session → Work → Break → End
  - Test pause/resume during work and break phases
  - Test soundscape switching during active session
  - Test volume control
  - Test notifications appear at correct times
  - Test state persistence by closing and reopening popup
  - Test ending session early
  - Verify all audio stops when session ends
  - Test with different ritual types (short-burst, long-form, recovery)
  - _Requirements: All_

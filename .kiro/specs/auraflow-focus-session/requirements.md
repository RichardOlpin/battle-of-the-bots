# Focus Session Experience Requirements

## Introduction

This specification defines the interactive Focus Session Timer and Active Guidance features for the AuraFlow Chrome Extension. These features complete the end-to-end user journey by allowing users to execute the AI-generated rituals with ambient soundscapes and compassionate notifications.

## Requirements

### Requirement 1: Focus Session Timer Interface

**User Story:** As a user, I want to start a focus session with a visual timer, so that I can stay on track with my work and break intervals.

#### Acceptance Criteria

1. WHEN the user clicks "Start Session" THEN the system SHALL display a new session screen with timer interface
2. WHEN the session screen is displayed THEN it SHALL show the ritual name, countdown timer, and current task goal
3. WHEN the work timer counts down THEN it SHALL update every second
4. WHEN the work timer reaches zero THEN the system SHALL automatically switch to break timer
5. WHEN displaying the timer THEN it SHALL use MM:SS format
6. WHEN the user clicks "Pause" THEN the timer SHALL pause and button SHALL change to "Resume"
7. WHEN the user clicks "End Session" THEN the system SHALL return to the main events screen

### Requirement 2: Ambient Soundscape Engine

**User Story:** As a user, I want to play ambient sounds during my focus session, so that I can create an optimal work environment.

#### Acceptance Criteria

1. WHEN the session screen is displayed THEN it SHALL show a soundscape selector dropdown
2. WHEN the user selects a soundscape THEN the system SHALL play the corresponding audio file on loop
3. WHEN the user selects "None" THEN any playing audio SHALL stop
4. WHEN audio is playing THEN the user SHALL be able to adjust volume with a slider
5. WHEN the session ends THEN any playing audio SHALL stop automatically
6. WHEN switching between soundscapes THEN the previous audio SHALL stop before new audio starts

### Requirement 3: Gentle Nudges and Affirmations

**User Story:** As a user, I want to receive compassionate notifications during my session, so that I feel supported and encouraged.

#### Acceptance Criteria

1. WHEN the work timer ends THEN the system SHALL display a browser notification
2. WHEN a notification is displayed THEN it SHALL include a randomly selected affirmation
3. WHEN creating affirmations THEN they SHALL use compassionate, non-judgmental language
4. WHEN a break timer ends THEN the system SHALL display a notification to resume work
5. WHEN notifications are shown THEN they SHALL use the chrome.notifications API
6. WHEN the extension is not in focus THEN notifications SHALL still appear

### Requirement 4: Session State Management

**User Story:** As a user, I want my session state to persist, so that I don't lose progress if I close the popup.

#### Acceptance Criteria

1. WHEN a session is active THEN the state SHALL be stored in chrome.storage
2. WHEN the popup is reopened during a session THEN it SHALL restore the session screen
3. WHEN the timer is running THEN it SHALL continue even if popup is closed
4. WHEN the session ends THEN the stored state SHALL be cleared
5. WHEN the user ends a session early THEN the state SHALL be cleared immediately

### Requirement 5: Ritual Integration

**User Story:** As a user, I want to start a session using an AI-generated ritual, so that I can follow personalized work patterns.

#### Acceptance Criteria

1. WHEN a ritual is generated THEN a "Start Session" button SHALL appear
2. WHEN the user clicks "Start Session" THEN the ritual data SHALL be used to configure the timer
3. WHEN configuring the timer THEN it SHALL use workDuration and breakDuration from the ritual
4. WHEN the session starts THEN it SHALL display the ritual name as the session title
5. WHEN mindfulnessBreaks is true THEN the system SHALL show mindfulness prompts during breaks

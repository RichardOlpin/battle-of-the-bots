/**
 * Unit tests for Intelligent Session Summary Service
 */

const {
  createIntelligentSummary,
  extractAction,
  selectRandomTemplate,
  replacePlaceholders
} = require('./summary.service');

describe('Summary Service', () => {
  describe('extractAction', () => {
    test('should extract "finalize" action from task goal', () => {
      expect(extractAction('Finalize the project report')).toBe('finalize');
      expect(extractAction('Complete the documentation')).toBe('finalize');
      expect(extractAction('Finish the presentation')).toBe('finalize');
      expect(extractAction('Wrap up the meeting notes')).toBe('finalize');
    });

    test('should extract "write" action from task goal', () => {
      expect(extractAction('Write blog post')).toBe('write');
      expect(extractAction('Draft email to client')).toBe('write');
      expect(extractAction('Compose meeting agenda')).toBe('write');
    });

    test('should extract "review" action from task goal', () => {
      expect(extractAction('Review pull request')).toBe('review');
      expect(extractAction('Analyze user feedback')).toBe('review');
      expect(extractAction('Evaluate design options')).toBe('review');
      expect(extractAction('Assess project risks')).toBe('review');
    });

    test('should extract "develop" action from task goal', () => {
      expect(extractAction('Develop new feature')).toBe('develop');
      expect(extractAction('Build authentication system')).toBe('develop');
      expect(extractAction('Create wireframes')).toBe('develop');
      expect(extractAction('Design database schema')).toBe('develop');
      expect(extractAction('Implement API endpoint')).toBe('develop');
    });

    test('should extract "plan" action from task goal', () => {
      expect(extractAction('Plan sprint activities')).toBe('plan');
      expect(extractAction('Organize project timeline')).toBe('plan');
      expect(extractAction('Structure presentation')).toBe('plan');
      expect(extractAction('Outline article')).toBe('plan');
    });

    test('should extract "research" action from task goal', () => {
      expect(extractAction('Research competitor products')).toBe('research');
      expect(extractAction('Investigate bug causes')).toBe('research');
      expect(extractAction('Explore new technologies')).toBe('research');
    });

    test('should extract "fix" action from task goal', () => {
      expect(extractAction('Fix login bug')).toBe('fix');
      expect(extractAction('Debug performance issue')).toBe('fix');
      expect(extractAction('Troubleshoot deployment')).toBe('fix');
      expect(extractAction('Resolve merge conflicts')).toBe('fix');
    });

    test('should extract "update" action from task goal', () => {
      expect(extractAction('Update dependencies')).toBe('update');
      expect(extractAction('Modify user interface')).toBe('update');
      expect(extractAction('Refactor code')).toBe('update');
      expect(extractAction('Improve performance')).toBe('update');
    });

    test('should extract "test" action from task goal', () => {
      expect(extractAction('Test new feature')).toBe('test');
      expect(extractAction('Validate user input')).toBe('test');
      expect(extractAction('Verify API responses')).toBe('test');
    });

    test('should extract "learn" action from task goal', () => {
      expect(extractAction('Learn React hooks')).toBe('learn');
      expect(extractAction('Practice algorithm problems')).toBe('learn');
      expect(extractAction('Study design patterns')).toBe('learn');
    });

    test('should be case-insensitive', () => {
      expect(extractAction('WRITE documentation')).toBe('write');
      expect(extractAction('write documentation')).toBe('write');
      expect(extractAction('Write documentation')).toBe('write');
    });

    test('should return null for unmatched patterns', () => {
      expect(extractAction('Random task without action verb')).toBeNull();
      expect(extractAction('Something else entirely')).toBeNull();
    });

    test('should return null for empty or invalid input', () => {
      expect(extractAction('')).toBeNull();
      expect(extractAction(null)).toBeNull();
      expect(extractAction(undefined)).toBeNull();
      expect(extractAction(123)).toBeNull();
    });
  });

  describe('selectRandomTemplate', () => {
    test('should return a template from the array', () => {
      const templates = ['Template 1', 'Template 2', 'Template 3'];
      const selected = selectRandomTemplate(templates);
      expect(templates).toContain(selected);
    });

    test('should return the only template if array has one element', () => {
      const templates = ['Only template'];
      expect(selectRandomTemplate(templates)).toBe('Only template');
    });

    test('should handle multiple calls and return valid templates', () => {
      const templates = ['A', 'B', 'C', 'D', 'E'];
      for (let i = 0; i < 20; i++) {
        const selected = selectRandomTemplate(templates);
        expect(templates).toContain(selected);
      }
    });
  });

  describe('replacePlaceholders', () => {
    test('should replace single placeholder', () => {
      const template = 'Hello {name}!';
      const result = replacePlaceholders(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    test('should replace multiple placeholders', () => {
      const template = 'You spent {duration} minutes on {goal}.';
      const result = replacePlaceholders(template, {
        duration: 45,
        goal: 'writing code'
      });
      expect(result).toBe('You spent 45 minutes on writing code.');
    });

    test('should replace multiple occurrences of same placeholder', () => {
      const template = '{name} said {name} is great!';
      const result = replacePlaceholders(template, { name: 'Alice' });
      expect(result).toBe('Alice said Alice is great!');
    });

    test('should handle no placeholders', () => {
      const template = 'No placeholders here';
      const result = replacePlaceholders(template, { name: 'Test' });
      expect(result).toBe('No placeholders here');
    });

    test('should handle empty values object', () => {
      const template = 'Hello {name}!';
      const result = replacePlaceholders(template, {});
      expect(result).toBe('Hello {name}!');
    });
  });

  describe('createIntelligentSummary', () => {
    describe('with valid task goals', () => {
      test('should generate summary with task goal and duration', () => {
        const sessionData = {
          taskGoal: 'Write documentation',
          duration: 45
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('45');
        expect(summary).toContain('Write documentation');
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });

      test('should generate summary for various task goal formats', () => {
        const taskGoals = [
          'Finalize project report',
          'Review pull requests',
          'Develop new feature',
          'Plan sprint activities',
          'Research competitors',
          'Fix critical bug',
          'Update documentation',
          'Test API endpoints',
          'Learn TypeScript'
        ];

        taskGoals.forEach(taskGoal => {
          const summary = createIntelligentSummary({
            taskGoal,
            duration: 30
          });
          
          expect(summary).toContain('30');
          expect(summary).toContain(taskGoal);
        });
      });

      test('should handle task goals with special characters', () => {
        const sessionData = {
          taskGoal: 'Write "Getting Started" guide',
          duration: 60
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('60');
        expect(summary).toContain('Write "Getting Started" guide');
      });

      test('should trim whitespace from task goals', () => {
        const sessionData = {
          taskGoal: '  Write documentation  ',
          duration: 45
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('Write documentation');
        expect(summary).not.toContain('  Write documentation  ');
      });
    });

    describe('with empty or undefined task goals', () => {
      test('should generate generic summary for empty string', () => {
        const sessionData = {
          taskGoal: '',
          duration: 30
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('30');
        expect(summary).not.toContain("''");
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });

      test('should generate generic summary for whitespace-only string', () => {
        const sessionData = {
          taskGoal: '   ',
          duration: 25
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('25');
        expect(typeof summary).toBe('string');
      });

      test('should generate generic summary for undefined task goal', () => {
        const sessionData = {
          taskGoal: undefined,
          duration: 40
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('40');
        expect(typeof summary).toBe('string');
      });

      test('should generate generic summary for null task goal', () => {
        const sessionData = {
          taskGoal: null,
          duration: 50
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('50');
        expect(typeof summary).toBe('string');
      });
    });

    describe('tone and language verification', () => {
      test('should use compassionate and supportive language', () => {
        const sessionData = {
          taskGoal: 'Complete task',
          duration: 30
        };
        const summary = createIntelligentSummary(sessionData);
        
        // Check for positive/supportive words
        const supportiveWords = [
          'great', 'nice', 'good', 'progress', 'momentum',
          'celebrating', 'invested', 'meaningful', 'matters',
          'solid', 'dedicated', 'committed', 'counts', 'forward'
        ];
        
        const hasSupportiveLanguage = supportiveWords.some(word => 
          summary.toLowerCase().includes(word)
        );
        
        expect(hasSupportiveLanguage).toBe(true);
      });

      test('should not contain judgmental language', () => {
        const sessionData = {
          taskGoal: 'Work on project',
          duration: 15
        };
        const summary = createIntelligentSummary(sessionData);
        
        // Check that negative/judgmental words are not present
        const judgmentalWords = [
          'should', 'must', 'failed', 'lazy', 'unproductive',
          'wasted', 'bad', 'poor', 'insufficient', 'inadequate'
        ];
        
        const hasJudgmentalLanguage = judgmentalWords.some(word =>
          summary.toLowerCase().includes(word)
        );
        
        expect(hasJudgmentalLanguage).toBe(false);
      });

      test('should generate different summaries for variety', () => {
        const sessionData = {
          taskGoal: 'Write code',
          duration: 45
        };
        
        const summaries = new Set();
        
        // Generate multiple summaries
        for (let i = 0; i < 50; i++) {
          const summary = createIntelligentSummary(sessionData);
          summaries.add(summary);
        }
        
        // Should have generated at least 2 different summaries
        // (with random selection, very likely to get variety)
        expect(summaries.size).toBeGreaterThan(1);
      });
    });

    describe('with optional session data fields', () => {
      test('should handle session with all optional fields', () => {
        const sessionData = {
          taskGoal: 'Review code',
          duration: 60,
          completedAt: '2025-10-02T14:30:00Z',
          distractionCount: 2,
          ritualUsed: 'Long-Form Deep Work'
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('60');
        expect(summary).toContain('Review code');
      });

      test('should handle session with minimal fields', () => {
        const sessionData = {
          taskGoal: 'Plan meeting',
          duration: 25
        };
        const summary = createIntelligentSummary(sessionData);
        
        expect(summary).toContain('25');
        expect(summary).toContain('Plan meeting');
      });
    });

    describe('error handling', () => {
      test('should throw error for missing session data', () => {
        expect(() => createIntelligentSummary()).toThrow('Session data is required');
        expect(() => createIntelligentSummary(null)).toThrow('Session data is required');
      });

      test('should throw error for invalid duration', () => {
        expect(() => createIntelligentSummary({
          taskGoal: 'Test',
          duration: 0
        })).toThrow('Valid duration is required');

        expect(() => createIntelligentSummary({
          taskGoal: 'Test',
          duration: -5
        })).toThrow('Valid duration is required');

        expect(() => createIntelligentSummary({
          taskGoal: 'Test',
          duration: 'invalid'
        })).toThrow('Valid duration is required');
      });

      test('should throw error for missing duration', () => {
        expect(() => createIntelligentSummary({
          taskGoal: 'Test'
        })).toThrow('Valid duration is required');
      });
    });
  });
});

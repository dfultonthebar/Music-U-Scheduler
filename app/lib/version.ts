
// Version Management System for Music U Scheduler
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  build: number;
  version: string;
  lastUpdated: string;
  changelog: VersionChange[];
}

export interface VersionChange {
  id: string;
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix' | 'build';
  description: string;
  changes: string[];
  author: string;
}

class VersionManager {
  private static instance: VersionManager;
  private storageKey = 'musicu_version_info';

  private constructor() {}

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }

  // Get current version info
  getCurrentVersion(): VersionInfo {
    if (typeof window === 'undefined') {
      return this.getDefaultVersion();
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading version info:', error);
    }

    return this.getDefaultVersion();
  }

  // Get default/initial version
  private getDefaultVersion(): VersionInfo {
    return {
      major: 1,
      minor: 2,
      patch: 0,
      build: 1,
      version: '1.2.0.1',
      lastUpdated: new Date().toISOString(),
      changelog: [
        {
          id: 'v1.2.0.1',
          version: '1.2.0.1',
          date: new Date().toISOString(),
          type: 'minor',
          description: 'Enhanced system with restart functionality and version management',
          changes: [
            'Added restart functionality after system updates',
            'Implemented version management system',
            'Enhanced GitHub updates component',
            'Fixed API export issues',
            'Improved backend authentication'
          ],
          author: 'DeepAgent'
        }
      ]
    };
  }

  // Increment version based on type
  incrementVersion(
    type: 'major' | 'minor' | 'patch' | 'build',
    description: string,
    changes: string[],
    author: string = 'DeepAgent'
  ): VersionInfo {
    const current = this.getCurrentVersion();
    let newVersion = { ...current };

    switch (type) {
      case 'major':
        newVersion.major += 1;
        newVersion.minor = 0;
        newVersion.patch = 0;
        newVersion.build = 0;
        break;
      case 'minor':
        newVersion.minor += 1;
        newVersion.patch = 0;
        newVersion.build = 0;
        break;
      case 'patch':
        newVersion.patch += 1;
        newVersion.build = 0;
        break;
      case 'build':
        newVersion.build += 1;
        break;
    }

    // Update version string
    newVersion.version = `${newVersion.major}.${newVersion.minor}.${newVersion.patch}.${newVersion.build}`;
    newVersion.lastUpdated = new Date().toISOString();

    // Add to changelog
    const newChange: VersionChange = {
      id: `v${newVersion.version}`,
      version: newVersion.version,
      date: new Date().toISOString(),
      type,
      description,
      changes,
      author
    };

    newVersion.changelog.unshift(newChange);

    // Keep only last 50 changelog entries
    if (newVersion.changelog.length > 50) {
      newVersion.changelog = newVersion.changelog.slice(0, 50);
    }

    this.saveVersion(newVersion);
    return newVersion;
  }

  // Save version info
  private saveVersion(versionInfo: VersionInfo): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(versionInfo));
      } catch (error) {
        console.error('Error saving version info:', error);
      }
    }
  }

  // Get formatted version string
  getVersionString(): string {
    const version = this.getCurrentVersion();
    return `v${version.version}`;
  }

  // Get short version (without build number)
  getShortVersion(): string {
    const version = this.getCurrentVersion();
    return `v${version.major}.${version.minor}.${version.patch}`;
  }

  // Get changelog for specific version
  getChangelogForVersion(version: string): VersionChange | null {
    const versionInfo = this.getCurrentVersion();
    return versionInfo.changelog.find(change => change.version === version) || null;
  }

  // Get recent changes (last n entries)
  getRecentChanges(count: number = 5): VersionChange[] {
    const version = this.getCurrentVersion();
    return version.changelog.slice(0, count);
  }
}

// Export singleton instance
export const versionManager = VersionManager.getInstance();

// Utility functions for common version operations
export const getCurrentVersion = () => versionManager.getCurrentVersion();
export const getVersionString = () => versionManager.getVersionString();
export const getShortVersion = () => versionManager.getShortVersion();
export const incrementVersion = (type: 'major' | 'minor' | 'patch' | 'build', description: string, changes: string[], author?: string) => 
  versionManager.incrementVersion(type, description, changes, author);

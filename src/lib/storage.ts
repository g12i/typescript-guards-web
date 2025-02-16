class Storage {
	getItem<T>(key: string): T | undefined {
		const stored = localStorage.getItem(key);

		if (!stored) {
			return;
		}

		try {
			const parsed = JSON.parse(stored);

			return parsed as T;
		} catch {
			// do nothing...
		}
	}
	setItem<T>(key: string, value: T): void {
		const stringified = JSON.stringify(value);

		localStorage.setItem(key, stringified);
	}
	ifPresent<T>(key: string, callback: (value: T) => void): void {
		const value = this.getItem<T>(key);

		if (value) {
			callback(value);
		}
	}
}

export const storage = new Storage();

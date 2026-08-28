export type BoardFileGroupName = "system" | "provel" | "screen";

export type BoardFileGroup = {
	version: string;
	/** Directory on the printer SD card, e.g. "0:/sys". */
	target: string;
	kind: "macros" | "screen-firmware";
	files: string[];
};

export type BoardFilesManifest = {
	generatedAt: string;
	groups: Record<string, BoardFileGroup>;
};

export type GroupStatus = {
	group: BoardFileGroupName;
	target: string;
	/** Version bundled with this build of the app. */
	bundledVersion: string;
	/** Version reported by the board, or null when nothing is installed. */
	installedVersion: string | null;
	needsUpdate: boolean;
	fileCount: number;
};

export type FileResult = {
	group: BoardFileGroupName;
	file: string;
	ok: boolean;
	bytes: number;
	ms: number;
	error?: string;
};

export type InstallSummary = {
	results: FileResult[];
	uploaded: number;
	failed: number;
	/** Set when 0:/sys changed, since config.g is only read at board start-up. */
	restartRequired: boolean;
};

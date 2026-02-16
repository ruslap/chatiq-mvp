import { LoggerService, LogLevel } from "@nestjs/common";
import { getRequestId } from "./correlation-id.middleware";

interface LogEntry {
	level: string;
	message: string;
	context?: string;
	requestId?: string;
	timestamp: string;
	[key: string]: unknown;
}

/**
 * Structured JSON logger for production.
 * Outputs one JSON object per line for easy ingestion by log aggregators
 * (ELK, Datadog, CloudWatch, etc.).
 *
 * In development (NODE_ENV !== 'production'), falls back to readable text.
 */
export class StructuredLogger implements LoggerService {
	private readonly isProduction =
		process.env.NODE_ENV === "production";

	log(message: string, context?: string): void {
		this.write("info", message, context);
	}

	error(message: string, trace?: string, context?: string): void {
		this.write("error", message, context, { trace });
	}

	warn(message: string, context?: string): void {
		this.write("warn", message, context);
	}

	debug(message: string, context?: string): void {
		if (this.isProduction) return; // suppress debug in prod
		this.write("debug", message, context);
	}

	verbose(message: string, context?: string): void {
		if (this.isProduction) return;
		this.write("verbose", message, context);
	}

	setLogLevels?(levels: LogLevel[]): void {
		// no-op — level filtering is handled by write()
	}

	private write(
		level: string,
		message: string,
		context?: string,
		extra?: Record<string, unknown>,
	): void {
		const requestId = getRequestId();

		if (this.isProduction) {
			const entry: LogEntry = {
				level,
				message,
				timestamp: new Date().toISOString(),
				...(context ? { context } : {}),
				...(requestId ? { requestId } : {}),
				...extra,
			};
			process.stdout.write(JSON.stringify(entry) + "\n");
		} else {
			const prefix = requestId ? `[${requestId.slice(0, 8)}]` : "";
			const ctx = context ? `[${context}]` : "";
			const ts = new Date().toISOString();
			const line = `${ts} ${level.toUpperCase().padEnd(7)} ${ctx}${prefix} ${message}`;
			if (level === "error") {
				process.stderr.write(line + "\n");
				if (extra?.trace) process.stderr.write(String(extra.trace) + "\n");
			} else {
				process.stdout.write(line + "\n");
			}
		}
	}
}

import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { AsyncLocalStorage } from "async_hooks";

export const requestStore = new AsyncLocalStorage<{ requestId: string }>();

export function getRequestId(): string | undefined {
	return requestStore.getStore()?.requestId;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction): void {
		const requestId =
			(req.headers["x-request-id"] as string) || randomUUID();

		res.setHeader("X-Request-Id", requestId);

		requestStore.run({ requestId }, () => {
			next();
		});
	}
}

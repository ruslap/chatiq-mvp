import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Request } from "express";
import { getRequestId } from "./correlation-id.middleware";

@Injectable()
export class RequestMetricsInterceptor implements NestInterceptor {
	private readonly logger = new Logger("HTTP");

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const req = context.switchToHttp().getRequest<Request>();
		const { method, originalUrl } = req;
		const start = Date.now();

		return next.handle().pipe(
			tap({
				next: () => {
					const duration = Date.now() - start;
					const statusCode = context.switchToHttp().getResponse().statusCode;
					const requestId = getRequestId();
					this.logger.log(
						`${method} ${originalUrl} ${statusCode} ${duration}ms` +
							(requestId ? ` [${requestId.slice(0, 8)}]` : ""),
					);
				},
				error: (err: Error) => {
					const duration = Date.now() - start;
					const requestId = getRequestId();
					this.logger.warn(
						`${method} ${originalUrl} ERR ${duration}ms` +
							(requestId ? ` [${requestId.slice(0, 8)}]` : "") +
							` ${err.message}`,
					);
				},
			}),
		);
	}
}

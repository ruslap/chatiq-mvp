import { Injectable, Logger } from "@nestjs/common";
import { verify } from "crypto";

export interface LicensePayload {
	licensee: string;       // Company/person name
	domain: string;         // Allowed domain (e.g. "example.com" or "*" for any)
	plan: string;           // "starter" | "pro" | "enterprise"
	maxSites: number;       // Max number of sites allowed
	expiresAt: string;      // ISO date string
	issuedAt: string;       // ISO date string
}

export interface LicenseStatus {
	valid: boolean;
	licensee?: string;
	plan?: string;
	domain?: string;
	maxSites?: number;
	expiresAt?: string;
	daysRemaining?: number;
	error?: string;
}

// ─── PUBLIC KEY ───────────────────────────────────────────────
// This is the VERIFY-ONLY key. The private signing key is kept
// separately by the project owner and NEVER shipped with the code.
// Replace this with your actual public key after running:
//   npx ts-node scripts/generate-license-keys.ts
// ──────────────────────────────────────────────────────────────
const LICENSE_PUBLIC_KEY = process.env.LICENSE_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAIVvhsM74gDLHdJJ3V/jbkOMhLUOtFUQKopJC7FTKsFw=
-----END PUBLIC KEY-----`;

@Injectable()
export class LicenseService {
	private readonly logger = new Logger(LicenseService.name);
	private cachedStatus: LicenseStatus | null = null;

	/**
	 * Validate the license at application startup.
	 * Returns the license status. Throws nothing — caller decides what to do.
	 */
	validateLicense(): LicenseStatus {
		const licenseKey = process.env.LICENSE_KEY;

		if (!licenseKey) {
			this.cachedStatus = { valid: false, error: "No LICENSE_KEY provided" };
			return this.cachedStatus;
		}

		try {
			// License key format: base64(JSON({ data: base64(payload), signature: base64(sig) }))
			const decoded = JSON.parse(Buffer.from(licenseKey, "base64").toString("utf-8"));
			const { data, signature } = decoded;

			if (!data || !signature) {
				this.cachedStatus = { valid: false, error: "Malformed license key" };
				return this.cachedStatus;
			}

			// Verify Ed25519 signature
			const isValid = verify(null, Buffer.from(data, "base64"), LICENSE_PUBLIC_KEY, Buffer.from(signature, "base64"));

			if (!isValid) {
				this.cachedStatus = { valid: false, error: "Invalid license signature" };
				return this.cachedStatus;
			}

			// Parse payload
			const payload: LicensePayload = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

			// Check expiry
			const expiresAt = new Date(payload.expiresAt);
			const now = new Date();
			if (expiresAt < now) {
				this.cachedStatus = {
					valid: false,
					licensee: payload.licensee,
					plan: payload.plan,
					expiresAt: payload.expiresAt,
					error: `License expired on ${payload.expiresAt}`,
				};
				return this.cachedStatus;
			}

			const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

			this.cachedStatus = {
				valid: true,
				licensee: payload.licensee,
				plan: payload.plan,
				domain: payload.domain,
				maxSites: payload.maxSites,
				expiresAt: payload.expiresAt,
				daysRemaining,
			};

			return this.cachedStatus;
		} catch (err) {
			this.cachedStatus = {
				valid: false,
				error: `License verification failed: ${err instanceof Error ? err.message : String(err)}`,
			};
			return this.cachedStatus;
		}
	}

	getStatus(): LicenseStatus {
		if (!this.cachedStatus) {
			return this.validateLicense();
		}
		return this.cachedStatus;
	}

	isValid(): boolean {
		return this.getStatus().valid;
	}
}

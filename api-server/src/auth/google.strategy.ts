import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

interface GoogleProfile {
    id: string;
    name: {
        givenName: string;
        familyName: string;
    };
    emails: Array<{ value: string }>;
    photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') ||
            `${configService.get<string>('PUBLIC_API_URL') || 'https://api.chtq.ink'}/auth/google/callback`;

        console.log('--- Google Auth Configuration ---');
        console.log('ClientID:', configService.get<string>('GOOGLE_CLIENT_ID') ? 'Set' : 'MISSING');
        console.log('CallbackURL:', callbackURL);
        console.log('-------------------------------');

        super({
            clientID: (configService.get<string>('GOOGLE_CLIENT_ID') || '').trim(),
            clientSecret: (configService.get<string>('GOOGLE_CLIENT_SECRET') || '').trim(),
            callbackURL: callbackURL.trim(),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: VerifyCallback,
    ) {
        const { name, emails, photos, id } = profile;
        const user = {
            googleId: id,
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
        };

        // Find or create user in DB
        const dbUser = await this.authService.validateGoogleUser(user);

        done(null, dbUser);
    }
}

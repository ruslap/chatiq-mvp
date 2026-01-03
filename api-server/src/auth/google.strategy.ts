import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            clientID: (configService.get<string>('GOOGLE_CLIENT_ID') || '').trim(),
            clientSecret: (configService.get<string>('GOOGLE_CLIENT_SECRET') || '').trim(),
            callbackURL: (configService.get<string>('GOOGLE_CALLBACK_URL') || '').trim(),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
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

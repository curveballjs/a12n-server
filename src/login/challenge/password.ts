import { AbstractLoginChallenge } from './abstract.js';
import { LoginChallengeContext, AuthorizationChallengeRequest, LoginSession } from '../types.js';
import { A12nLoginChallengeError } from '../error.js';
import * as services from '../../services.js';

type PasswordParameters = {
  password: string;
}

export class LoginChallengePassword extends AbstractLoginChallenge<PasswordParameters> {

  /**
   * The type of authentication factor this class provides.
   */
 readonly authFactor = 'password';

  /**
   * Returns true if the user has this auth factor set up.
   *
   * For example, if a user has a TOTP device setup this should
   * return true for the totp challenge class.
   */
  userHasChallenge(): Promise<boolean> {

    return services.user.hasPassword(this.principal);

  }

  /**
   * Handle the user response to a challenge.
   *
   * Should return true if the challenge passed.
   * Should throw an Error ihe challenge failed.
   */
  async checkResponse(loginContext: LoginChallengeContext): Promise<boolean> {

    this.validateParameters(loginContext.parameters);
    const { success, errorMessage } = await services.user.validateUserCredentials(loginContext.principal, loginContext.parameters.password, loginContext.log);
    if (!success && errorMessage) {
      throw new A12nLoginChallengeError(
        loginContext.session,
        errorMessage,
        'username_or_password_invalid',
      );
    }

    return true;

  }

  /**
   * Should return true if parameters contain a response to the challenge.
   *
   * For example, for the password challenge this checks if the paremters contained
   * a 'password' key.
   */
  parametersContainsResponse(parameters: AuthorizationChallengeRequest): parameters is PasswordParameters {

    return parameters.password  !== undefined;

  }

  /**
   * Emits the challenge. This is done in situations that no credentials have
   * been received yet.
   */
  challenge(session: LoginSession): never {

    throw new A12nLoginChallengeError(
      session,
      'A username and password are required',
      'password_required',
    );

  }

}

export type PasswordRecoveryRequest = {
  email: string;
};

const mockedFailureEmail = "erro@example.com";

export async function requestPasswordRecovery(request: PasswordRecoveryRequest) {
  await Promise.resolve();

  if (request.email.trim().toLowerCase() === mockedFailureEmail) {
    throw new Error("Mock password recovery failed.");
  }
}

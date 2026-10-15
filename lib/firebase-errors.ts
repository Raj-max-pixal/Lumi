export function firebaseErrorMessage(error: unknown, action: string): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";
  if (message.includes("has been deactivated") || message.includes("423")) {
    return "Lumi's database is temporarily deactivated. Shared activity is unavailable; the separate demo is still available.";
  }
  if (code === "PERMISSION_DENIED" || code === "database/permission-denied" || code === "storage/unauthorized") {
    return `${action} was denied by Firebase security rules. Sign in with the correct account or contact Lumi support.`;
  }
  if (code === "auth/unauthorized-domain") return "This website is not an authorized Firebase sign-in domain. Contact Lumi support.";
  if (code === "auth/operation-not-allowed") return "This sign-in method is not enabled in Firebase Authentication.";
  if (code === "auth/popup-closed-by-user") return "Google sign-in was closed before it finished.";
  if (code === "auth/email-already-in-use") return "This email already has an account. Sign in instead.";
  if (code === "auth/weak-password") return "Choose a stronger password.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Email or password was not accepted.";
  if (code === "storage/quota-exceeded") return "Lumi's upload storage is full. Please try later.";
  if (code === "storage/canceled") return "Upload was canceled.";
  if (code === "auth/network-request-failed" || code === "storage/retry-limit-exceeded" || code === "database/disconnected") return "Connection to Firebase failed. Check your internet connection and retry.";
  return `${action} failed. Please retry or contact Lumi support if the problem continues.`;
}

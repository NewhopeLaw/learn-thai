# Google Drive backup: setup for later

Status: **not in use.** The app currently backs up through GitHub. Google Drive backup was built and then set aside until there are more users. The working code is in commit `7a0b66a` ("Google Drive backup (sign in once per device)") and can be restored from there.

What it gives learners: one "Sign in with Google" tap per device; progress saves to a private, hidden app folder in their own Google Drive at the start and end of every session; a new device restores by signing in. No keys or QR codes.

## Register the app (on your PC, signed in to your Google account)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project named **Learn Thai**.
2. Search the top bar for **Google Drive API**, open it and click **Enable**.
3. Open **Google Auth Platform** (search "OAuth consent" if you can't find it) and click **Get started**:
   * App name **Learn Thai**, your email as support email.
   * Audience: **External**.
   * Contact email: yours, then **Create**.
4. Still in Google Auth Platform:
   * **Audience → Test users → Add users:** add your Gmail, plus the other learners'.
   * **Data access → Add or remove scopes:** search **drive.appdata**, tick it and **Update**, then **Save**.
5. **Clients → Create client:**
   * Application type: **Web application**.
   * **Authorized JavaScript origins**, add both: `https://newhopelaw.github.io` and `http://localhost:8765` (the second is for local testing).
   * **Create**, then copy the **Client ID**. It ends in `.apps.googleusercontent.com`.
6. Put the Client ID in `app/config.js` as `window.GOOGLE_CLIENT_ID = '…';`. It isn't a secret: it only works on the two addresses above.

## Notes

* While the app is in Google's "testing" mode, only the test users from step 4 can sign in, and each sees an "unverified app" warning the first time (click **Continue**). That's fine for a small group; publishing to production removes the limit.
* The scope `drive.appdata` only lets the app see its own hidden folder, not the user's other Drive files.
* Sign-in tokens last an hour, so on phones Google's sign-in window may briefly blink when a session starts.

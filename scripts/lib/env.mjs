import dotenv from 'dotenv';

// .env.local (secrets, git-ignored) takes precedence over .env (committed); real environment variables win over both.
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

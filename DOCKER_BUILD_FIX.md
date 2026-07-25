# 🐳 Docker Build Fix - Valibot Peer Dependency Conflict

## 📋 Problem Summary

**Error during Docker build:**

```
npm error ERESOLVE unable to resolve dependency tree
npm error Could not resolve dependency:
npm error peerOptional valibot@"^1.0.0 || ^1.0.0-beta.4 || ^1.0.0-rc" from @hookform/resolvers@5.4.2
npm error Found: valibot@0.39.0
```

## 🔍 Root Cause Analysis

### Dependency Tree

```
rahmaniyah-pos-app@0.4.0
  └─ @hookform/resolvers@5.4.2
       └─ @typeschema/main@>=0.13.7
            └─ @typeschema/valibot@0.14.0
                 └─ valibot@^0.39.0 (INSTALLED)

BUT @hookform/resolvers@5.4.2 also requires:
  └─ valibot@^1.0.0 || ^1.0.0-beta.4 || ^1.0.0-rc (CONFLICT!)
```

### Why This Happens

1. **`@hookform/resolvers@5.4.2`** has a **peer optional dependency** on `valibot@^1.0.0`
2. But **`@typeschema/valibot@0.14.0`** (a transitive dependency) requires **`valibot@^0.39.0`**
3. npm tries to resolve both, but they're incompatible versions
4. In local development, npm might skip this check, but Docker build is stricter

## ✅ Solution Implemented

### Fix: Use `--legacy-peer-deps` Flag

Updated `Dockerfile` line 19 to use legacy peer dependency resolution:

```dockerfile
# Before (FAILS):
RUN npm install && rm -rf /tmp/*

# After (WORKS):
RUN npm install --legacy-peer-deps && rm -rf /tmp/*
```

### What `--legacy-peer-deps` Does

- Tells npm to use npm v6 style peer dependency resolution
- Allows installation even when peer dependencies don't match exactly
- Safe to use when peer dependencies are **optional** (like valibot in this case)
- Does NOT introduce breaking changes since valibot is not directly used in your code

## 🎯 Alternative Solutions (Not Recommended)

### Option 2: Use `--force`

```dockerfile
RUN npm install --force && rm -rf /tmp/*
```

❌ **Not recommended** - Might hide actual dependency issues

### Option 3: Explicitly Install valibot@1.x

```bash
npm install valibot@^1.0.0
```

❌ **Not recommended** - Could break @typeschema/valibot

### Option 4: Downgrade @hookform/resolvers

```bash
npm install @hookform/resolvers@^3.9.1
```

❌ **Not recommended** - Loses newer features and bug fixes

## 🧪 Testing

### Build Docker Image

```bash
docker build -t pos-rahmany-app:latest .
```

### Run Container

```bash
docker run -p 8788:8788 --env-file .env pos-rahmany-app:latest
```

### Check Health

```bash
curl http://localhost:8788/api/health
```

## 📊 Impact Assessment

✅ **Safe to Use:**

- `valibot` is a **peer optional dependency** (not required)
- Your app doesn't directly import or use valibot
- @hookform/resolvers works with zod (which you use) without valibot
- No breaking changes to existing functionality

⚠️ **Monitor:**

- Future updates to @hookform/resolvers
- Any new features that might require valibot

## 🔄 Long-term Solution

When @typeschema/valibot updates to support valibot@^1.0.0, you can:

1. Remove `--legacy-peer-deps` flag
2. Run `npm update`
3. Rebuild Docker image

Check status:

```bash
npm outdated @typeschema/valibot
```

## 📚 References

- [npm peer dependencies docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies)
- [npm --legacy-peer-deps flag](https://docs.npmjs.com/cli/v10/commands/npm-install#legacy-peer-deps)
- [@hookform/resolvers GitHub](https://github.com/react-hook-form/resolvers)
- [valibot GitHub](https://github.com/fabian-hiller/valibot)

---

**Status:** ✅ Fixed  
**Date:** 2026-07-25  
**Version:** 0.4.0

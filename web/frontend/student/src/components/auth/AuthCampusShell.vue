<script setup>
defineProps({
  compactText: { type: String, required: true }
})
</script>

<template>
  <main class="auth-shell">
    <section class="auth-visual" aria-label="梧桐校园">
      <img class="auth-visual__photo" src="/images/campus-v2.webp" alt="" />
      <div class="auth-visual__wash" aria-hidden="true"></div>
      <div class="auth-visual__content">
        <div class="auth-brand">
          <span class="auth-brand__symbol" aria-hidden="true">
            <svg viewBox="0 0 40 40" focusable="false">
              <path d="M4 5h13a3 3 0 0 1 3 3v12H8a4 4 0 0 1-4-4Z" />
              <path d="M23 4h13v12a4 4 0 0 1-4 4H23Z" opacity=".65" />
              <path d="M4 23h16v13H8a4 4 0 0 1-4-4Z" opacity=".65" />
              <path d="M23 23h13v13H23Z" opacity=".3" />
            </svg>
          </span>
          <span class="auth-brand__text"><b>梧桐校园</b><small>Campus AI</small></span>
        </div>

        <div class="auth-story-copy">
          <slot name="story" />
        </div>
        <p class="auth-story-compact">{{ compactText }}</p>
      </div>
    </section>

    <section class="auth-form-panel">
      <div class="auth-form-content">
        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(400px, .92fr);
  background: #f4f7fb;
}
.auth-visual {
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  display: flex;
  padding: clamp(32px, 4.5vw, 64px);
  color: #fff;
}
.auth-visual__photo,
.auth-visual__wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.auth-visual__photo {
  z-index: -2;
  object-fit: cover;
  object-position: 48% 52%;
}
.auth-visual__wash {
  z-index: -1;
  background: radial-gradient(circle at 76% 14%, rgba(240, 217, 162, .25), transparent 36%),
    linear-gradient(180deg, rgba(24, 54, 91, .18), rgba(24, 54, 91, .3) 38%, rgba(24, 54, 91, .84));
}
.auth-visual__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}
.auth-brand__symbol {
  width: 40px;
  height: 40px;
  display: inline-flex;
  fill: #fff;
}
.auth-brand__symbol svg {
  width: 100%;
  height: 100%;
}
.auth-brand__text b {
  display: block;
  font-size: 20px;
  letter-spacing: .5px;
}
.auth-brand__text small {
  color: rgba(255, 255, 255, .74);
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.auth-story-copy {
  max-width: 560px;
  margin: auto 0;
  padding: 56px 0 9vh;
}
.auth-story-copy :slotted(.hello) {
  color: rgba(255, 255, 255, .82);
  font-size: 14px;
}
.auth-story-copy :slotted(h2) {
  margin: 16px 0 20px;
  font-size: clamp(31px, 3.1vw, 40px);
  line-height: 1.42;
  font-weight: 700;
  letter-spacing: -1px;
}
.auth-story-copy :slotted(.auth-story-more) {
  color: rgba(255, 255, 255, .78);
  font-size: 14px;
  line-height: 1.9;
}
.auth-story-compact {
  display: none;
}
.auth-form-panel {
  min-width: 0;
  min-height: 100vh;
  min-height: 100svh;
  overflow-y: auto;
  display: grid;
  place-items: center;
  padding: 48px clamp(24px, 5vw, 72px);
  background: radial-gradient(ellipse at 95% 8%, rgba(182, 213, 198, .2), transparent 30%),
    radial-gradient(ellipse at 4% 92%, rgba(49, 91, 184, .07), transparent 34%),
    #f4f7fb;
}
.auth-form-content {
  width: min(100%, 400px);
  margin: auto;
}
@media (max-width: 960px) and (min-width: 821px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr) minmax(380px, .95fr);
  }
  .auth-visual {
    padding: 34px;
  }
}
@media (max-width: 820px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 120px auto;
  }
  .auth-visual {
    min-height: 120px;
    padding: 14px 22px;
  }
  .auth-visual__content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .auth-story-copy {
    display: none;
  }
  .auth-story-compact {
    display: block;
    margin: 0;
    color: rgba(255, 255, 255, .9);
    font-size: 13px;
  }
  .auth-form-panel {
    min-height: calc(100svh - 120px);
    place-items: start center;
    padding: 28px 20px 36px;
  }
}
/* 同频校园：本页展示布局，业务绑定保持原样 */
.auth-shell {
  background: var(--atlas-sky);
  color: var(--ink);
  grid-template-columns: minmax(0,1fr) minmax(360px,460px);
  gap: 48px;
  padding: 48px;
  align-items: center;
  min-height: 100dvh;
}
.auth-visual {
  border-radius: 30px;
  min-height: 640px;
  overflow: hidden;
}
.auth-visual__wash {
  background: linear-gradient(180deg,rgb(36 79 70 / 12%),rgb(20 45 38 / 80%));
}
.auth-visual__content {
  padding: 40px;
}
.auth-form-panel {
  padding: 0;
  min-width: 0;
  background: transparent;
}
.auth-form-content {
  max-width: none;
  width: 100%;
}
.auth-brand__symbol {
  background: var(--accent);
  color: var(--accent-ink);
}
.auth-brand__text {
  font-size: 24px;
}
.auth-story-copy h1,.auth-story-copy h2 {
  font-size: clamp(28px,3vw,44px);
}
.auth-story-compact {
  font-size: 14px;
}
@media (max-width:1000px) {
  .auth-shell {
    grid-template-columns: minmax(0,1fr);
    grid-template-rows: auto auto;
    padding: 24px;
    gap: 24px;
  }
  .auth-visual {
    min-height: 240px;
    height: 280px;
  }
  .auth-visual__content {
    padding: 28px;
  }
  .auth-story-copy {
    display: none;
  }
  .auth-story-compact {
    display: block;
  }
  .auth-form-panel {
    max-width: 600px;
    width: 100%;
    margin: auto;
    min-height: 0;
  }
}
@media (max-width:600px) {
  .auth-shell {
    padding: 16px;
    gap: 16px;
  }
  .auth-visual {
    min-height: 180px;
    height: 180px;
    border-radius: 24px;
  }
  .auth-visual__content {
    padding: 24px;
  }
}
</style>

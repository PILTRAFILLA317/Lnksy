<script lang="ts">
  import { motion, type Variants } from '@humanspeak/svelte-motion';

  const floatVariants: Variants = {
    float: {
      y: [-10, 10, -10],
      transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
    },
  };
</script>

<div class="relative select-none" aria-hidden="true">
  <!-- Background glow bloom -->
  <div
    class="absolute -inset-20 -z-10 rounded-full pointer-events-none"
    style="background: radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 45%, transparent 70%); filter: blur(40px);"
  ></div>

  <motion.div variants={floatVariants} animate="float" class="relative">
    <!-- Phone outer shell -->
    <div
      class="relative rounded-[44px] overflow-hidden"
      style="
        width: 252px;
        height: 516px;
        background: linear-gradient(165deg, #1c1c35 0%, #0c0c1e 100%);
        border: 1.5px solid rgba(255,255,255,0.10);
        box-shadow:
          0 60px 120px rgba(0,0,0,0.75),
          inset 0 1px 0 rgba(255,255,255,0.07),
          0 0 0 0.5px rgba(255,255,255,0.04) inset,
          0 0 80px rgba(139,92,246,0.10);
      "
    >
      <!-- Inner screen -->
      <div
        class="absolute rounded-[43px] overflow-hidden flex flex-col"
        style="inset: 2px; background: #07070f;"
      >
        <!-- Dynamic island notch -->
        <div
          class="absolute top-[10px] left-1/2 -translate-x-1/2 z-20 rounded-full"
          style="width: 54px; height: 16px; background: #07070f;"
        ></div>

        <!-- Cover banner -->
        <div
          class="relative shrink-0 overflow-hidden"
          style="height: 88px;"
        >
          <div
            class="absolute inset-0"
            style="background: linear-gradient(135deg, rgba(109,40,217,0.70) 0%, rgba(12,12,30,0.60) 55%, rgba(6,182,212,0.40) 100%);"
          ></div>
          <div
            class="absolute inset-0"
            style="background: radial-gradient(ellipse at 25% 60%, rgba(139,92,246,0.50) 0%, transparent 65%);"
          ></div>
          <div
            class="absolute inset-0"
            style="background: radial-gradient(ellipse at 80% 40%, rgba(6,182,212,0.25) 0%, transparent 55%);"
          ></div>
        </div>

        <!-- Scrollable content -->
        <div class="flex flex-col items-center px-4 pb-5 overflow-hidden flex-1">
          <!-- Avatar overlapping cover -->
          <div
            class="-mt-7 shrink-0 flex items-center justify-center rounded-full z-10 text-xl"
            style="
              width: 52px;
              height: 52px;
              background: linear-gradient(135deg, #7c3aed, #0891b2);
              border: 2.5px solid #07070f;
              box-shadow: 0 0 24px rgba(139,92,246,0.40);
              font-size: 14px;
              font-weight: 700;
              color: rgba(139,92,246,0.9);
              letter-spacing: 0.02em;
            "
          >MC</div>

          <!-- Name + bio -->
          <div class="text-center mt-2 shrink-0">
            <div style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.92); letter-spacing: 0.01em;">
              maya.creates
            </div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.32); margin-top: 2px;">
              Digital Creator · NYC
            </div>
          </div>

          <!-- Link buttons -->
          <div class="w-full mt-3 shrink-0" style="display: flex; flex-direction: column; gap: 7px;">
            <div style="padding: 9px 12px; text-align: center; font-size: 10.5px; font-weight: 500; border-radius: 9px; background: rgba(139,92,246,0.18); border: 1px solid rgba(139,92,246,0.30); color: rgba(167,139,250,0.92);">
              Stream new single
            </div>
            <div style="padding: 9px 12px; text-align: center; font-size: 10.5px; font-weight: 500; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.50);">
              Shop my collection
            </div>
            <div style="padding: 9px 12px; text-align: center; font-size: 10.5px; font-weight: 500; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.50);">
              Photography presets
            </div>
            <div style="padding: 9px 12px; text-align: center; font-size: 10.5px; font-weight: 500; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.50);">
              Watch on YouTube
            </div>
          </div>

          <!-- Socials row -->
          <div class="flex gap-2 mt-3 shrink-0">
            {#each ['𝕏', 'IG', 'YT', 'TK'] as s}
              <div
                style="width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.28);"
              >{s}</div>
            {/each}
          </div>

          <!-- Footer branding -->
          <div
            class="mt-auto pt-2 shrink-0"
            style="font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 500; color: rgba(255,255,255,0.10);"
          >
            lnksy.com/maya
          </div>
        </div>
      </div>

      <!-- Home indicator bar -->
      <div
        class="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full"
        style="width: 80px; height: 3px; background: rgba(255,255,255,0.12);"
      ></div>
    </div>
  </motion.div>
</div>

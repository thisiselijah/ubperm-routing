const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  console.log("Has ThreeDPlaybackControls:", content.includes('ThreeDPlaybackControls') || content.includes('bg-[var(--color-canvas)] border-t-2 border-black relative'));
  console.log("Has Playback controls wrapper:", content.includes('3D Playback Controls at the bottom of Right Panel') || content.includes('shadow-[4px_4px_0_#000] border-2 border-black flex-shrink-0'));
  
  await browser.close();
})();

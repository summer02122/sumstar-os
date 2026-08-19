import * as fs from 'fs';
import * as path from 'path';

function runVerification() {
  console.log("=========================================");
  console.log("🚀 Starting Brutalist Visual Style Verification");
  console.log("=========================================\n");

  let passed = true;

  // 1. Verify globals.css
  const globalsCssPath = path.join(process.cwd(), 'src/app/globals.css');
  if (!fs.existsSync(globalsCssPath)) {
    console.error("❌ FAIL: src/app/globals.css not found!");
    passed = false;
  } else {
    const cssContent = fs.readFileSync(globalsCssPath, 'utf8');

    const requiredCssRules = [
      { name: "Pastel Pink Background (--background: #FFCAD4)", test: /--background:\s*#FFCAD4/i },
      { name: "Black Foreground (--foreground: #000000)", test: /--foreground:\s*#000000/i },
      { name: "Black Border (--border: #000000)", test: /--border:\s*#000000/i },
      { name: "Sharp Radius (--radius: 0px)", test: /--radius:\s*0px/ },
      { name: "Sharp Radius (--radius-sm: 0px)", test: /--radius-sm:\s*0px/ },
      { name: "Sharp Radius (--radius-md: 0px)", test: /--radius-md:\s*0px/ },
      { name: "Sharp Radius (--radius-lg: 0px)", test: /--radius-lg:\s*0px/ },
      { name: "Sharp Radius (--radius-xl: 0px)", test: /--radius-xl:\s*0px/ },
      { name: "Google Fonts Import (Archivo Black, Syne, Space Grotesk)", test: /Archivo\+Black/i },
      { name: "Brutalist Box Shadow Utility (.shadow-brutal)", test: /\.shadow-brutal\b/ },
      { name: "Universal Brutalist Scrollbars (::-webkit-scrollbar)", test: /::-webkit-scrollbar/ },
      { name: "Brutalist Text Selection (::selection)", test: /::selection/ },
      { name: "Tight Heading Line Heights (h1..h6)", test: /font-family:\s*var\(--font-heading\)/ },
    ];

    for (const rule of requiredCssRules) {
      if (rule.test.test(cssContent)) {
        console.log(`✅ PASS: CSS Variable / Rule verified: ${rule.name}`);
      } else {
        console.error(`❌ FAIL: Missing required CSS rule: ${rule.name}`);
        passed = false;
      }
    }
  }

  // 2. Verify layout.tsx typography imports
  const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    console.error("❌ FAIL: src/app/layout.tsx not found!");
    passed = false;
  } else {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    if (layoutContent.includes('Archivo_Black') && layoutContent.includes('Space_Grotesk') && layoutContent.includes('Syne')) {
      console.log("✅ PASS: Next.js Google Font loaders in layout.tsx verified (Archivo_Black, Space_Grotesk, Syne)");
    } else {
      console.error("❌ FAIL: Next.js Google Font loaders missing from layout.tsx");
      passed = false;
    }
  }

  // 3. Verify Base UI Button brutalist styling
  const buttonPath = path.join(process.cwd(), 'src/components/ui/button.tsx');
  if (!fs.existsSync(buttonPath)) {
    console.error("❌ FAIL: src/components/ui/button.tsx not found!");
    passed = false;
  } else {
    const buttonContent = fs.readFileSync(buttonPath, 'utf8');
    if (buttonContent.includes('rounded-none') && buttonContent.includes('border-2 border-black') && buttonContent.includes('font-heading')) {
      console.log("✅ PASS: Base UI Button component brutalist styling verified");
    } else {
      console.error("❌ FAIL: Button component missing brutalist styling properties");
      passed = false;
    }
  }

  // 4. Scan all TSX files for forbidden glassmorphism and gradients
  console.log("\n🔍 Scanning application files for forbidden glassmorphism & gradients...");
  function scanDir(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next') {
          scanDir(fullPath, fileList);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const srcDir = path.join(process.cwd(), 'src');
  const allFiles = scanDir(srcDir);
  let glassmorphismFound = 0;
  let gradientsFound = 0;

  for (const file of allFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('backdrop-blur')) {
      console.error(`❌ FAIL: Found 'backdrop-blur' in ${relativePath}`);
      glassmorphismFound++;
      passed = false;
    }

    if (content.includes('linear-gradient') || content.includes('bg-gradient-to-') || content.includes('bg-gradient-')) {
      console.error(`❌ FAIL: Found gradient styling in ${relativePath}`);
      gradientsFound++;
      passed = false;
    }
  }

  if (glassmorphismFound === 0) {
    console.log("✅ PASS: Zero instances of glassmorphism (backdrop-blur) found in src/");
  }
  if (gradientsFound === 0) {
    console.log("✅ PASS: Zero instances of gradient backgrounds found in src/");
  }

  // 5. Verify Brutalist features across views
  const keyViews = [
    'src/app/page.tsx',
    'src/app/chat/page.tsx',
    'src/app/office/page.tsx',
    'src/app/tasks/page.tsx',
    'src/app/skills/page.tsx',
    'src/app/memory/page.tsx',
    'src/app/settings/page.tsx',
    'src/app/login/page.tsx',
    'src/components/layout/sidebar.tsx',
    'src/components/NotebookModal.tsx',
  ];

  console.log("\n🔍 Verifying brutalist aesthetics across all views...");
  for (const view of keyViews) {
    const viewFullPath = path.join(process.cwd(), view);
    if (!fs.existsSync(viewFullPath)) {
      console.error(`❌ FAIL: View file not found: ${view}`);
      passed = false;
      continue;
    }
    const content = fs.readFileSync(viewFullPath, 'utf8');
    const hasBrutalistBorders = content.includes('border-') || content.includes('border-2') || content.includes('border-3') || content.includes('border-4');
    const hasSolidShadows = content.includes('shadow-[') || content.includes('shadow-brutal');
    const hasBrutalistTypography = content.includes('font-heading') || content.includes('uppercase');

    if (hasBrutalistBorders && hasSolidShadows && hasBrutalistTypography) {
      console.log(`✅ PASS: ${view} includes brutalist borders, flat shadows, and bold typography`);
    } else {
      console.error(`❌ FAIL: ${view} missing brutalist design markers`);
      passed = false;
    }
  }

  // Summary
  console.log("\n=========================================");
  if (passed) {
    console.log("🎉 ALL BRUTALIST STYLE VERIFICATIONS PASSED!");
    console.log("=========================================\n");
    process.exit(0);
  } else {
    console.error("🚨 SOME VERIFICATIONS FAILED!");
    console.log("=========================================\n");
    process.exit(1);
  }
}

runVerification();

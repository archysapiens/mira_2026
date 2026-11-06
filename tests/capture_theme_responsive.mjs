import { chromium } from 'playwright';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/c14b9d10-e8a1-4cad-9add-487d037d706a';

async function main() {
  console.log('Iniciando capturas de pantalla con Chrome real...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // ----------------------------------------------------
    // 1. DESKTOP 1440x900 - LANDING CLARO & OSCURO
    // ----------------------------------------------------
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();

    // 1.1 Inicio público Claro (1440x900)
    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Asegurar tema claro
    await desktopPage.evaluate(() => {
      localStorage.setItem('mira_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
      path: path.join(OUTPUT_DIR, '01_desktop_inicio_claro_1440x900.png'),
      fullPage: false,
    });
    console.log('✓ 01_desktop_inicio_claro_1440x900.png');

    // 1.2 Inicio público Oscuro (1440x900)
    await desktopPage.evaluate(() => {
      localStorage.setItem('mira_theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
      path: path.join(OUTPUT_DIR, '02_desktop_inicio_oscuro_1440x900.png'),
      fullPage: false,
    });
    console.log('✓ 02_desktop_inicio_oscuro_1440x900.png');

    // 1.3 Funnel Paso 2 (Servicios) Escritorio Claro - EXACTO AL SCREENSHOT DEL USUARIO (6 seleccionados)
    await desktopPage.evaluate(() => {
      localStorage.setItem('mira_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    // Abrir modal con botón de cotizar
    const ctaBtn = desktopPage.locator('button:has-text("Cotizar ahora"), button:has-text("Cotizar servicio"), button:has-text("Cotizar")').first();
    await ctaBtn.click();
    await desktopPage.waitForSelector('#quoteModalContainer');
    
    // Paso 1 -> Seleccionar Empresa
    await desktopPage.locator('button:has-text("Empresa / Planta")').click();
    await desktopPage.waitForTimeout(300);

    // En Paso 2: Seleccionar los 6 servicios que aparecen en la captura del usuario:
    // 1. Silos, 2. Sanidad, 3. Estructuras, 4. Hoteles, 5. Residenciales, 6. Tablaroca
    const servicesToSelect = [
      'Limpieza y sanitización de silos',
      'Sanidad y limpieza técnica',
      'Estructuras metálicas y naves',
      'Servicios para hoteles',
      'Servicios residenciales',
      'Tablaroca y acabados',
    ];
    for (const sName of servicesToSelect) {
      const card = desktopPage.locator(`div[role="checkbox"]:has-text("${sName}")`);
      const isChecked = await card.getAttribute('aria-checked');
      if (isChecked !== 'true') {
        await card.click();
      }
    }
    await desktopPage.waitForTimeout(400);

    // Capturar modal completo en escritorio claro (para comparar 1:1 con la captura del usuario)
    const modalElem = desktopPage.locator('#quoteModalContainer');
    await modalElem.screenshot({
      path: path.join(OUTPUT_DIR, '11_funnel_paso2_escritorio_claro_referencia.png'),
    });
    console.log('✓ 11_funnel_paso2_escritorio_claro_referencia.png');

    // 1.4 Funnel Paso 2 (Servicios) Escritorio Oscuro
    await desktopPage.evaluate(() => {
      localStorage.setItem('mira_theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await desktopPage.waitForTimeout(400);
    await modalElem.screenshot({
      path: path.join(OUTPUT_DIR, '12_funnel_paso2_escritorio_oscuro.png'),
    });
    console.log('✓ 12_funnel_paso2_escritorio_oscuro.png');

    await desktopContext.close();

    // ----------------------------------------------------
    // 2. MOBILE 390x844 (iPhone 14 / estándar moderno)
    // ----------------------------------------------------
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    // 2.1 Inicio público claro móvil (390x844)
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.evaluate(() => {
      localStorage.setItem('mira_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '03_mobile_inicio_claro_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 03_mobile_inicio_claro_390x844.png');

    // 2.2 Inicio público oscuro móvil (390x844)
    await mobilePage.evaluate(() => {
      localStorage.setItem('mira_theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '04_mobile_inicio_oscuro_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 04_mobile_inicio_oscuro_390x844.png');

    // 2.3 Funnel Servicios en móvil (390x844)
    // Abrir modal de cotización en móvil
    const mobileCta = mobilePage.locator('button:has-text("Cotizar ahora"), button:has-text("Cotizar servicio"), button:has-text("Cotizar")').first();
    await mobileCta.click();
    await mobilePage.waitForSelector('#quoteModalContainer');
    
    // Paso 1 móvil -> Seleccionar espacio
    await mobilePage.locator('#quoteModalContainer button:has-text("Empresa / Planta")').click();
    await mobilePage.waitForTimeout(300);

    // Seleccionar 2 servicios en móvil para ilustrar selección
    await mobilePage.locator('#quoteModalContainer div[role="checkbox"]:has-text("Limpieza y sanitización de silos")').click();
    await mobilePage.locator('#quoteModalContainer div[role="checkbox"]:has-text("Sanidad y limpieza técnica")').click();
    await mobilePage.waitForTimeout(300);

    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '05_funnel_servicios_mobile_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 05_funnel_servicios_mobile_390x844.png');

    // 2.4 Funnel Proyecto en móvil (390x844)
    await mobilePage.locator('#btnContinueServices').click();
    await mobilePage.waitForTimeout(300);

    // Rellenar campos de proyecto
    await mobilePage.locator('#quoteState').selectOption('Aguascalientes');
    await mobilePage.waitForTimeout(100);
    await mobilePage.locator('#quoteMunicipality').selectOption('Aguascalientes');
    await mobilePage.locator('#quoteAddress').fill('Parque Industrial del Valle, Bodega 4B');
    await mobilePage.locator('#quoteRequestedDate').fill('2026-11-20');
    await mobilePage.locator('#quoteDescription').fill('Mantenimiento y sanitización especializada en 4 silos de almacenamiento.');
    await mobilePage.waitForTimeout(300);

    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '06_funnel_proyecto_mobile_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 06_funnel_proyecto_mobile_390x844.png');

    // 2.5 Funnel Contacto en móvil (390x844)
    await mobilePage.locator('button:has-text("Continuar a Contacto")').click();
    await mobilePage.waitForTimeout(300);

    // Rellenar campos de contacto
    await mobilePage.locator('#quoteContactName').fill('Ing. Carlos Morales');
    await mobilePage.locator('#quoteContactPhone').fill('5551234567');
    await mobilePage.locator('#quoteContactCompany').fill('Industrias Morales SA');
    await mobilePage.locator('#quoteContactEmail').fill('carlos.morales@mira-test.dev');
    await mobilePage.waitForTimeout(300);

    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '07_funnel_contacto_mobile_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 07_funnel_contacto_mobile_390x844.png');

    // Cerrar modal
    const closeBtn = mobilePage.locator('#quoteModalContainer button[aria-label*="Cerrar"]').first();
    await closeBtn.click();
    await mobilePage.waitForTimeout(300);

    // ----------------------------------------------------
    // 3. PANELES MÓVIL (Cliente, Operador, Admin)
    // ----------------------------------------------------
    // 3.1 Iniciar sesión como Cliente
    await mobilePage.goto(`${BASE_URL}/login`);
    await mobilePage.waitForTimeout(300);
    // Simular sesión de cliente directamente vía localStorage
    await mobilePage.evaluate(() => {
      const mockClientUser = {
        id: 101,
        email: 'cliente.demo@mira.dev',
        name: 'Roberto Gómez',
        role: 'CLIENT',
        isVerified: true,
      };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ id: 101, email: 'cliente.demo@mira.dev', name: 'Roberto Gómez', role: 'CLIENT', exp: Math.floor(Date.now() / 1000) + 36000 }));
      localStorage.setItem('mira_token', `${header}.${payload}.sig`);
      localStorage.setItem('mira_user', JSON.stringify(mockClientUser));
    });
    await mobilePage.goto(`${BASE_URL}/client/dashboard`);
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '08_panel_cliente_mobile_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 08_panel_cliente_mobile_390x844.png');

    // 3.2 Iniciar sesión como Operador
    await mobilePage.evaluate(() => {
      const mockOpUser = {
        id: 201,
        email: 'operador.demo@mira.dev',
        name: 'Marcos Soto',
        role: 'OPERATOR',
        isVerified: true,
      };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ id: 201, email: 'operador.demo@mira.dev', name: 'Marcos Soto', role: 'OPERATOR', exp: Math.floor(Date.now() / 1000) + 36000 }));
      localStorage.setItem('mira_token', `${header}.${payload}.sig`);
      localStorage.setItem('mira_user', JSON.stringify(mockOpUser));
    });
    await mobilePage.goto(`${BASE_URL}/operator/dashboard`);
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '09_panel_operador_mobile_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 09_panel_operador_mobile_390x844.png');

    // 3.3 Iniciar sesión como Administrador
    await mobilePage.evaluate(() => {
      const mockAdminUser = {
        id: 301,
        email: 'admin.demo@mira.dev',
        name: 'Administrador MIRA',
        role: 'ADMIN',
        isVerified: true,
      };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ id: 301, email: 'admin.demo@mira.dev', name: 'Administrador MIRA', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 36000 }));
      localStorage.setItem('mira_token', `${header}.${payload}.sig`);
      localStorage.setItem('mira_user', JSON.stringify(mockAdminUser));
    });
    await mobilePage.goto(`${BASE_URL}/admin/dashboard`);
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '10_panel_administrador_mobile_390x844.png'),
      fullPage: false,
    });
    console.log('✓ 10_panel_administrador_mobile_390x844.png');

    await mobileContext.close();
    console.log('¡Todas las capturas se completaron exitosamente!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Error durante la captura:', err);
  process.exit(1);
});


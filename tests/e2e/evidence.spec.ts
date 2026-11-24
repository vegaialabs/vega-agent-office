import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('evidence navigation and isolated local demo',async({page})=>{
 await page.goto('/');
 await page.getByRole('link',{name:'Evidencias y calidad'}).click();
 await expect(page).toHaveURL(/\/evidence$/);
 await expect(page.getByRole('heading',{name:'Development Evidence'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Quality Center'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Architecture Center'})).toBeVisible();
 await expect(page.getByText('Aceptación global pendiente.',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.getByRole('link',{name:'Abrir demo interactiva'}).click();
 await expect(page).toHaveURL(/\/demo$/);
 await expect(page.getByRole('status')).toContainText('Demo local');
 await page.getByLabel('Nombre del proyecto').fill('Demo independiente');
 await page.getByRole('button',{name:'Crear proyecto',exact:true}).click();
 await page.reload();
 await expect(page.getByLabel('Proyecto activo')).toHaveValue(/.+/);
 await expect(page.getByLabel('Proyecto activo').locator('option:checked')).toHaveText('Demo independiente');
});

test('technical handbook is accessible and navigable',async({page})=>{
 await page.goto('/');await page.getByRole('link',{name:'Documentación técnica'}).click();
 await expect(page).toHaveURL(/\/documentation$/);
 await expect(page.getByRole('heading',{name:'Documentación técnica',exact:true})).toBeVisible();
 await expect(page.getByText('AGENTS.md',{exact:true})).toBeVisible();
 await expect(page.getByText('agents/testing.md',{exact:true})).toBeVisible();
 await expect(page.getByText('npm run test:auth',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.getByRole('link',{name:'Demo local',exact:true}).click();await expect(page.getByRole('status')).toContainText('Demo local');
});

test('English guide and downloadable quality report',async({page})=>{
 await page.goto('/');await page.getByRole('link',{name:'English guide',exact:true}).click();
 await expect(page).toHaveURL(/\/en$/);await expect(page.getByRole('heading',{name:'Try the demo without signing in'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download quality report (Markdown)'}).click();expect((await download).suggestedFilename()).toBe('quality-report.md');
 const report=await page.request.get('/quality-report.md');expect(report.ok()).toBe(true);expect(await report.text()).toContain('Overall acceptance: BLOCKED');
});

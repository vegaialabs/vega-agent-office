import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('projects, workflow, evidence, reload and keyboard access',async({page})=>{
 await page.goto('/');await expect(page.getByRole('status')).toContainText('Demo local');
 await page.keyboard.press('Tab');await expect(page.getByText('Saltar al tablero')).toBeFocused();
 await page.getByLabel('Nombre del proyecto').fill('Proyecto E2E');await page.getByRole('button',{name:'Crear proyecto',exact:true}).click();
 await page.getByLabel('Título de tarea').fill('Tarea E2E');await page.getByRole('button',{name:'+ Crear',exact:true}).click();
 await page.getByRole('button',{name:/Tarea E2E/}).click();await page.getByRole('button',{name:'Asignar a Develop',exact:true}).click();
 await page.getByRole('button',{name:'Enviar a Testing',exact:true}).click();await page.getByRole('button',{name:'Aprobar',exact:true}).click();
 await expect(page.locator('.error[role=alert]')).toContainText('evidencias');
 await page.getByLabel('Nota / evidencia').fill('Prueba fallida reproducida');await page.getByRole('button',{name:'Devolver a Develop',exact:true}).click();
 await page.getByRole('button',{name:'Enviar a Testing',exact:true}).click();await page.getByLabel('Nota / evidencia').fill('Verificación completada');await page.getByRole('button',{name:'Aprobar',exact:true}).click();
 await expect(page.locator('.detail li')).toHaveCount(5);await page.reload();await page.getByLabel('Proyecto activo').selectOption({label:'Proyecto E2E'});await expect(page.getByRole('button',{name:/Tarea E2E.*Rev. 5/})).toBeVisible();
 await page.getByLabel('Proyecto activo').selectOption({label:'Proyecto de demostración'});await expect(page.getByRole('button',{name:/Tarea E2E/})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 const accessibility=await new AxeBuilder({page}).analyze();expect(accessibility.violations).toEqual([]);
});

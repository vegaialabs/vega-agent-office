
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('virtual office follows selected project and correction activity',async({page})=>{
 await page.goto('/demo');await expect(page.getByRole('status')).toContainText('Demo local');
 await page.getByLabel('Nombre del proyecto').fill('Oficina E2E');await page.getByRole('button',{name:'Crear proyecto',exact:true}).click();
 await page.getByLabel('Título de tarea').fill('Tarea oficina');await page.getByRole('button',{name:'+ Crear',exact:true}).click();
 const office=page.locator('#office');const orch=office.getByRole('article',{name:'Mesa de Orchestrator'});const dev=office.getByRole('article',{name:'Mesa de Develop'});const testing=office.getByRole('article',{name:'Mesa de Testing'});
 await expect(orch).toContainText('Tarea oficina');await page.getByRole('button',{name:/Tarea oficina/}).click();await page.getByRole('button',{name:'Asignar a Develop',exact:true}).click();await expect(dev).toContainText('Tarea oficina');await expect(orch).not.toContainText('Tarea oficina');
 await page.getByRole('button',{name:'Enviar a Testing',exact:true}).click();await expect(testing).toContainText('Tarea oficina');await page.getByLabel('Nota / evidencia').fill('Corregir revisión');await page.getByRole('button',{name:'Devolver a Develop',exact:true}).click();await expect(dev).toContainText('1 correcciones');await expect(office.locator('.office-activity')).toContainText('Corregir revisión');
 await page.getByRole('button',{name:'Enviar a Testing',exact:true}).click();await page.getByLabel('Nota / evidencia').fill('Validación final');await page.getByRole('button',{name:'Aprobar',exact:true}).click();await expect(office.locator('.office-summary')).toContainText('1 / 1');
 await page.reload();await expect(office.locator('.office-summary')).toContainText('1 / 1');await page.getByLabel('Proyecto activo').selectOption({label:'Proyecto de demostración'});await expect(office).not.toContainText('Tarea oficina');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

import {test,expect} from '@playwright/test';
test('missing sitekey blocks anonymous sign-in without Auth request',async({page})=>{
 let calls=0;await page.route('https://captcha-test.supabase.co/**',async r=>{calls++;await r.abort()});await page.goto('/');await expect(page.getByText('Inicio anónimo bloqueado: falta configurar CAPTCHA.')).toBeVisible();await expect(page.getByRole('button',{name:'Iniciar demo con Supabase'})).toBeDisabled();expect(calls).toBe(0);
});

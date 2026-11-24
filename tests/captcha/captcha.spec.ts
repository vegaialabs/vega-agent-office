import {test,expect,type Page} from '@playwright/test';
async function mock(page:Page){
 await page.route('https://challenges.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:`window.widgetRenders=0;window.turnstile={render(el,options){window.captchaOptions=options;window.widgetRenders++;return String(window.widgetRenders)},remove(){}};`}));
}
async function callback(page:Page,name:string,token='fresh-token'){await page.waitForFunction(()=>Boolean((window as unknown as {captchaOptions?:unknown}).captchaOptions));await page.evaluate(({name,token})=>{(window as unknown as {captchaOptions:Record<string,(token:string)=>void>}).captchaOptions[name](token)},{name,token});}
test('expiry, error, consumed token and retry',async({page})=>{
 await mock(page);const tokens:string[]=[];
 await page.route('https://captcha-test.supabase.co/**',async r=>{if(r.request().url().includes('/signup'))tokens.push(r.request().postDataJSON().gotrue_meta_security.captcha_token);await r.fulfill({status:400,json:{msg:'CAPTCHA rejected'}})});
 await page.goto('/');const start=page.getByRole('button',{name:'Iniciar demo con Supabase'});await expect(start).toBeDisabled();expect(tokens).toEqual([]);
 await callback(page,'callback');await expect(start).toBeEnabled();await callback(page,'expired-callback');await expect(start).toBeDisabled();
 await callback(page,'callback');await callback(page,'error-callback');await expect(start).toBeDisabled();
 await callback(page,'callback','attempt-one');await start.click();await expect(page.locator('.error')).toBeVisible();await expect(start).toBeDisabled();expect(tokens).toEqual(['attempt-one']);
 await callback(page,'callback','attempt-two');await start.click();await expect(start).toBeDisabled();expect(tokens).toEqual(['attempt-one','attempt-two']);
});
test('successful CAPTCHA sign-in loads project session',async({page})=>{
 await mock(page);let token='';await page.route('https://captcha-test.supabase.co/**',async r=>{
 const url=r.request().url();if(url.includes('/signup')){token=r.request().postDataJSON().gotrue_meta_security.captcha_token;await r.fulfill({json:{access_token:'test-access-token',refresh_token:'test-refresh-token',expires_in:3600,token_type:'bearer',user:{id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',is_anonymous:true}}});}else await r.fulfill({json:[]});
 });await page.goto('/');await callback(page,'callback','success-token');await page.getByRole('button',{name:'Iniciar demo con Supabase'}).click();await expect(page.getByRole('status')).toContainText('sesión aislada');await expect(page.getByRole('button',{name:'Iniciar demo con Supabase'})).toHaveCount(0);expect(token).toBe('success-token');
});
test('script failure blocks sign-in',async({page})=>{
 await page.route('https://challenges.cloudflare.com/**',r=>r.abort());await page.goto('/');await expect(page.getByText('No se pudo verificar CAPTCHA.')).toBeVisible();await expect(page.getByRole('button',{name:'Iniciar demo con Supabase'})).toBeDisabled();
});

test('local demo remains offline with remote configuration',async({page})=>{
 let remoteCalls=0;
 await page.route('https://captcha-test.supabase.co/**',async r=>{remoteCalls++;await r.abort()});
 await page.route('https://challenges.cloudflare.com/**',async r=>{remoteCalls++;await r.abort()});
 await page.goto('/demo');await expect(page.getByRole('status')).toContainText('Demo local');
 await page.getByLabel('Nombre del proyecto').fill('Local sin conexión');await page.getByRole('button',{name:'Crear proyecto',exact:true}).click();
 await page.getByLabel('Título de tarea').fill('Tarea offline');await page.getByRole('button',{name:'+ Crear',exact:true}).click();
 await expect(page.getByRole('button',{name:/Tarea offline/})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:/Tarea offline/})).toBeVisible();
 await expect(page.getByRole('button',{name:'Iniciar demo con Supabase'})).toHaveCount(0);expect(remoteCalls).toBe(0);
});

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Manager,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();

            // my custom settings menu item
            let settings = MenuItemBuilder::new("Settings...")
                .id("settings")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            // my custom app submenu
            let app_submenu = SubmenuBuilder::new(app, "App")
                .about(Some(AboutMetadata {
                    ..Default::default()
                }))
                .separator()
                .item(&settings)
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .quit()
                .build()?;

            // ... any other submenus

            let menu = MenuBuilder::new(app)
                .items(&[
                    &app_submenu,
                    // ... include references to any other submenus
                ])
                .build()?;

            // set the menu
            app.set_menu(menu)?;

            // listen for menu item click events
            app.on_menu_event(move |app, event| {
                if event.id() == settings.id() {
                    // emit a window event to the frontend
                    // let _event = app.emit("custom-event", "/settings");
                    println!("Settings clicked");
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    // app_lib::run();
}

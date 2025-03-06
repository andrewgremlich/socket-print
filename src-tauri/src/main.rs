// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Manager,
};

// TUTORIAL https://ratulmaharaj.com/posts/tauri-custom-menu/

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();

            // my custom settings menu item
            let settings = MenuItemBuilder::new("Settings")
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

            let open_file = MenuItemBuilder::new("Open File")
                .id("open_file")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let restore_defaults = MenuItemBuilder::new("Restore Defaults")
                .id("restore_defaults")
                .build(app)?;
            let clear_model = MenuItemBuilder::new("Clear Model")
                .id("clear_model")
                .build(app)?;
            let file_submenu = SubmenuBuilder::new(app, "File")
                .item(&open_file)
                .item(&restore_defaults)
                .item(&clear_model)
                .build()?;

            let add_material_profile = MenuItemBuilder::new("Add Material Profile")
                .id("add_material_profile")
                .build(app)?;
            let edit_active_material_profile = MenuItemBuilder::new("Edit Active Material Profile")
                .id("edit_active_material_profile")
                .build(app)?;
            let delete_active_material_profile =
                MenuItemBuilder::new("Delete Active Material Profile")
                    .id("delete_active_material_profile")
                    .build(app)?;
            let edit_sub_menu = SubmenuBuilder::new(app, "Edit")
                .item(&add_material_profile)
                .item(&edit_active_material_profile)
                .item(&delete_active_material_profile)
                .build()?;

            let help_page = MenuItemBuilder::new("Help Page")
                .id("help_page")
                .build(app)?;
            let help_sub_menu = SubmenuBuilder::new(app, "Help").item(&help_page).build()?;

            let menu = MenuBuilder::new(handle)
                .items(&[
                    &app_submenu,
                    &file_submenu,
                    &edit_sub_menu,
                    &help_sub_menu,
                    // ... include references to any other submenus
                ])
                .build()?;

            // set the menu
            app.set_menu(menu)?;

            // listen for menu item click events
            app.on_menu_event(move |app, event| match event.id() {
                id if id == settings.id() => {
                    println!("Settings clicked");
                }
                id if id == open_file.id() => {
                    println!("Open File clicked");
                }
                id if id == restore_defaults.id() => {
                    println!("Restore Defaults clicked");
                }
                id if id == clear_model.id() => {
                    println!("Clear Model clicked");
                }
                id if id == add_material_profile.id() => {
                    println!("Add Material Profile clicked");
                }
                id if id == edit_active_material_profile.id() => {
                    println!("Edit Active Material Profile clicked");
                }
                id if id == delete_active_material_profile.id() => {
                    println!("Delete Active Material Profile clicked");
                }
                id if id == help_page.id() => {
                    println!("Help Page clicked");
                }
                _ => {}
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    // app_lib::run();
}

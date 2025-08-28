import { NgModule } from "@angular/core";
import { CommonModule } from "modules/common/common.module";
import { ExtensionsComponent } from "./extensions.component";
import { AvatarExtensionsComponent } from "./components/avatar-extensions/avatar-extensions.component";
import { AvatarExtensionsImportComponent } from "./components/avatar-extensions/avatar-extensions-import.component";
import { FilesComponent } from "./components/file/files.component";
import { ImportComponent } from "./components/import/import.component";
import { CharacterExtensionsComponent } from "./components/character-extensions/character-extensions.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ExtensionsComponent,
    AvatarExtensionsComponent,
    AvatarExtensionsImportComponent,
    FilesComponent,
    ImportComponent,
    CharacterExtensionsComponent
  ],
  entryComponents: [
    AvatarExtensionsImportComponent
  ],
  exports: [
    ExtensionsComponent
  ]
})
export class ExtensionsModule { }

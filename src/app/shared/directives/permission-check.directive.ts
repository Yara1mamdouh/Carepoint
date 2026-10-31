import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthRoleService, UserRole } from '../../core/services/auth-role.service';

@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionCheckDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authRole = inject(AuthRoleService);

  private allowedRoles: UserRole[] = [];
  private hasView = false;

  @Input()
  set appPermission(roles: UserRole[] | UserRole) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever role signal changes
      this.authRole.currentRole();
      this.updateView();
    });
  }

  private updateView(): void {
    const isAllowed = this.allowedRoles.length === 0 || this.authRole.hasRole(this.allowedRoles);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

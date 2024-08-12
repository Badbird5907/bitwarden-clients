import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { BehaviorSubject } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions";
import { ProductTierType } from "@bitwarden/common/billing/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { ToastService } from "@bitwarden/components";

import BrowserPopupUtils from "../../../../../../platform/popup/browser-popup-utils";
import { FilePopoutUtilsService } from "../../../../../../tools/popup/services/file-popout-utils.service";

import { OpenAttachmentsComponent } from "./open-attachments.component";

describe("OpenAttachmentsComponent", () => {
  let component: OpenAttachmentsComponent;
  let fixture: ComponentFixture<OpenAttachmentsComponent>;
  let router: Router;
  const showToast = jest.fn();
  const hasPremiumFromAnySource$ = new BehaviorSubject<boolean>(true);
  const openCurrentPagePopout = jest
    .spyOn(BrowserPopupUtils, "openCurrentPagePopout")
    .mockResolvedValue(null);
  const cipherView = {
    id: "5555-444-3333",
    type: CipherType.Login,
    name: "Test Login",
    login: {
      username: "username",
      password: "password",
    },
  } as CipherView;

  const cipherDomain = {
    decrypt: () => cipherView,
  };

  const org = {
    name: "Test Org",
    productTierType: ProductTierType.Enterprise,
  } as Organization;

  const getCipher = jest.fn().mockResolvedValue(cipherDomain);
  const getOrganization = jest.fn().mockResolvedValue(org);
  const showFilePopoutMessage = jest.fn().mockReturnValue(false);

  beforeEach(async () => {
    openCurrentPagePopout.mockClear();
    getCipher.mockClear();
    showToast.mockClear();
    getOrganization.mockClear();
    showFilePopoutMessage.mockClear();

    await TestBed.configureTestingModule({
      imports: [OpenAttachmentsComponent, RouterTestingModule],
      providers: [
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: BillingAccountProfileStateService, useValue: { hasPremiumFromAnySource$ } },
        {
          provide: CipherService,
          useValue: {
            get: getCipher,
            getKeyForCipherKeyDecryption: () => Promise.resolve(null),
          },
        },
        {
          provide: ToastService,
          useValue: { showToast },
        },
        {
          provide: OrganizationService,
          useValue: { get: getOrganization },
        },
        {
          provide: FilePopoutUtilsService,
          useValue: { showFilePopoutMessage },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenAttachmentsComponent);
    component = fixture.componentInstance;
    component.cipherId = "5555-444-3333" as CipherId;
    router = TestBed.inject(Router);
    jest.spyOn(router, "navigate").mockResolvedValue(true);
    fixture.detectChanges();
  });

  it("opens attachments in new popout", async () => {
    showFilePopoutMessage.mockReturnValue(true);

    await component.ngOnInit();

    await component.openAttachments();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(openCurrentPagePopout).toHaveBeenCalledWith(
      window,
      "http:/localhost//attachments?cipherId=5555-444-3333",
    );
  });

  it("opens attachments in same window", async () => {
    showFilePopoutMessage.mockReturnValue(false);

    await component.ngOnInit();

    await component.openAttachments();

    expect(openCurrentPagePopout).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/attachments"], {
      queryParams: { cipherId: "5555-444-3333" },
    });
  });

  it("routes the user to the premium page when they cannot access premium features", async () => {
    hasPremiumFromAnySource$.next(false);

    await component.openAttachments();

    expect(router.navigate).toHaveBeenCalledWith(["/premium"]);
  });

  describe("Free Orgs", () => {
    beforeEach(() => {
      component.cipherIsAPartOfFreeOrg = undefined;
    });

    it("sets `cipherIsAPartOfFreeOrg` to false when the cipher is not a part of an organization", async () => {
      cipherView.organizationId = null;

      await component.ngOnInit();

      expect(component.cipherIsAPartOfFreeOrg).toBe(false);
    });

    it("sets `cipherIsAPartOfFreeOrg` to true when the cipher is a part of a free organization", async () => {
      cipherView.organizationId = "888-333-333";
      org.productTierType = ProductTierType.Free;

      await component.ngOnInit();

      expect(component.cipherIsAPartOfFreeOrg).toBe(true);
    });

    it("sets `cipherIsAPartOfFreeOrg` to false when the organization is not free", async () => {
      cipherView.organizationId = "888-333-333";
      org.productTierType = ProductTierType.Families;

      await component.ngOnInit();

      expect(component.cipherIsAPartOfFreeOrg).toBe(false);
    });

    it("shows toast when the cipher is a part of a free org", async () => {
      component.canAccessAttachments = true;
      component.cipherIsAPartOfFreeOrg = true;

      await component.openAttachments();

      expect(showToast).toHaveBeenCalledWith({
        variant: "error",
        title: null,
        message: "freeOrgsCannotUseAttachments",
      });
    });
  });
});

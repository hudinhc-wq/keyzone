
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.QSVzdYsv.js","/cdn/shopifycloud/checkout-web/assets/c1/app.Bqzhj1V5.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor.AKGX6lYo.js","/cdn/shopifycloud/checkout-web/assets/c1/context-browser.XPSb056Y.js","/cdn/shopifycloud/checkout-web/assets/c1/grouping.C7F1hRl8.js","/cdn/shopifycloud/checkout-web/assets/c1/cvv-cvvBridge.DZTYx8bn.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors.Cpo9mcfU.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-buyer-consent.CakQlJ3y.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-shop-theme.Cn3filMg.js","/cdn/shopifycloud/checkout-web/assets/c1/checkout-updaters-helpers.MDcAixqa.js","/cdn/shopifycloud/checkout-web/assets/c1/receipt-mapper-load-recovery.D_yp4zzw.js","/cdn/shopifycloud/checkout-web/assets/c1/receipt-eager-mappers.BDGeAPf2.js","/cdn/shopifycloud/checkout-web/assets/c1/error-logger-report-graphql-error.zu23n4hk.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-normalizeBuyerDetails.BlaJGBHo.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-shopCashMoney.BVo0WjME.js","/cdn/shopifycloud/checkout-web/assets/c1/mappers-checkout-policy.nRNabfR6.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-installments-monorail.B_DKP96v.js","/cdn/shopifycloud/checkout-web/assets/c1/hydrate.BwOHrpuo.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-browser.BFhAV2_u.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-pt-BR.C35uJwum.js","/cdn/shopifycloud/checkout-web/assets/c1/OnePage.DDdqSzD7.js","/cdn/shopifycloud/checkout-web/assets/c1/components-DeliveryTransition.Bga5-PBk.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName.DZj5MEJD.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowShopPayOptin.DFd57lQJ.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useCanChangeCompanyLocation.D1NvIYtR.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink.DTHXnTqZ.js","/cdn/shopifycloud/checkout-web/assets/c1/BillingAddressForm.BIhhXOOB.js","/cdn/shopifycloud/checkout-web/assets/c1/PhoneField.BIXjpa4L.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUnauthenticatedErrorModal.B2R1pQvR.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-compact.BN2Yj2pj.js","/cdn/shopifycloud/checkout-web/assets/c1/Popover.BibZ7HOF.js","/cdn/shopifycloud/checkout-web/assets/c1/Choice.67K-eQIl.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSuppressShopPayModalOnLoad.DLWDub_D.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl.Xm-pa2dJ.js","/cdn/shopifycloud/checkout-web/assets/c1/ImpressionEventCapture.CL9xmz_l.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useEcpSpiDebugLog.Uc0bBYqv.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo.DBKqC9C_.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout.CN-3JFVm.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePostPurchase.DpGMSeHD.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsMonorailTrack.CGYHqJap.js","/cdn/shopifycloud/checkout-web/assets/c1/IncentiveBadge.CQsnO5mO.js","/cdn/shopifycloud/checkout-web/assets/c1/Section-SectionStyleOverride.Bdfun3-L.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-publishMessage.DRzRU-q-.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks.5w_2ZnWD.js","/cdn/shopifycloud/checkout-web/assets/c1/PendingShipping.74x7mlZt.js","/cdn/shopifycloud/checkout-web/assets/c1/Switch.CLTmh_37.js","/cdn/shopifycloud/checkout-web/assets/c1/useAddressMutationsWithNegotiation.CkgDYaVT.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentIcon.-xBIZoOF.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentLine.qKc5yyo4.js","/cdn/shopifycloud/checkout-web/assets/c1/Theme-ThemeOverride.hUe3ZIv1.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress.Dv63tLeh.js","/cdn/shopifycloud/checkout-web/assets/c1/payment-usePaymentExemptionReason.g4PJ4-r_.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayProgressIntercepts.DF4IHrB7.js","/cdn/shopifycloud/checkout-web/assets/c1/Section.DKB-QN_P.js","/cdn/shopifycloud/checkout-web/assets/c1/negotiated-findSelectedDeliveryMethod.nmhSKXrd.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner.BFjq-F5-.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage.swK9Xew_.js","/cdn/shopifycloud/checkout-web/assets/c1/StickyPayButton-StickyPayButton.module.M5RoWgjJ.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-payment-button.DZTilD44.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePreselectSpi.DAlncv-V.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useAvailableShopPromotionDiscounts.BnY4Sk73.js","/cdn/shopifycloud/checkout-web/assets/c1/Middot.Cv9KRR-H.js","/cdn/shopifycloud/checkout-web/assets/c1/EstimatedDeliveryContent.DilKCk7t.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodRateLabel.otTVIWRx.js","/cdn/shopifycloud/checkout-web/assets/c1/shipping-methods-consolidated-included.Bons5g3z.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingLines._EHQn0hN.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.qXe0M0md.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.GViHZ1qN.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector.DXM5XhN8.js","/cdn/shopifycloud/checkout-web/assets/c1/TextArea.DvLLn0Td.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.Ed7dO5iA.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList.3B3vyVxh.js","/cdn/shopifycloud/checkout-web/assets/c1/page-BelowTheFoldContent.BmtK3hye.js","/cdn/shopifycloud/checkout-web/assets/c1/Captcha.ChC3UKBC.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayCaptcha.B1Jy6N-1.js","/cdn/shopifycloud/checkout-web/assets/c1/RememberMeSection.B6hZxVeI.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentMethods.DYKyNmhK.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary.BgDwOXYD.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPaySessionTokenStorage.PqovJXjd.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButtonSection.CMR2coI0.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentButtons.DQkREauG.js","/cdn/shopifycloud/checkout-web/assets/c1/utils-useViolationsHandler.nN-SLJGG.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentOptionSelector.68Pwu9Bc.js","/cdn/shopifycloud/checkout-web/assets/c1/BillingAddressSelector.VkqGdQzz.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useStableHostMethodsReferences.DIt4vgeH.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.BmRUgqBf.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/grouping.DJksNKpk.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/previous.BxMbnyWp.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.DxMZvmU_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DeliveryTransition.BPR3LV8c.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Switch.BS8yVgoP.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useAddressMutationsWithNegotiation.BcTJoNaV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Section.CU18S7Ap.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentLine.D3bcP-mr.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StickyPayButton.CPXhWoNv.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentIcon.gzvCNwz_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayProgressIntercepts.CIy8uDiZ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Choice.aPApdPe_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/IncentiveBadge.Dlnp55te.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BillingAddressForm.BdwN7V1K.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.CpHF4L7Q.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PhoneField.uZEuHncj.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Middot.D7Ujmshx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingLines.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/EstimatedDeliveryContent.B_THySFF.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/publishMessage.CuRoM9zv.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BelowTheFoldContent.CxfTiM6_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Captcha.CJQgLR0i.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RememberMeSection.JBO5WNhc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MobileOrderSummary.2B5x30PG.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PayButtonSection.CZuxzxFG.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentOptionSelector.s-Kd_X2E.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentMethods.1rEt_I9C.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentButtons.BwQxlzN-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useSuppressShopPayModalOnLoad.SrYMuQu4.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPaySessionTokenStorage.DfWUBaTh.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Popover.Bi1nHaU-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethodSelector.B0hio2RO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SubscriptionPriceBreakdown.vTcdVGq4.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  
# OpenText / ALDI–HOFER technical integration enquiry

Megjegyzés, 2026-10-12: a később megkapott portálképek alapján elsőként a Task 1 űrlapot kell kitölteni. Ez az e-mail kiegészítő egyeztető tervezet; nem helyettesíti a portál feladatait. A mezőnkénti útmutató és az automatikus fogadáshoz javasolt kapcsolattípus: [OpenText Task 1](opentext-task1-kitoltese-20261012.md).

Date: 11 October 2026

To: AldiHofer.ob@opentext.com

Subject: GAVA-HUNGRIA KFT. – 1060776-AT-2 – Automated ERP integration / API connectivity – Project PIN 25347

Dear OpenText Onboarding Team,

Thank you for inviting GAVA-HUNGRIA KFT. to the ALDI/HOFER EDI onboarding process. We have activated the onboarding account 1060776-AT-2.1 and set the password.

Our objective is to integrate our own ERP system directly with the approved ALDI/HOFER EDI service. We require automated receipt and processing of purchase orders, subsequent order amendments, line-item deletions and complete order cancellations, without manual document downloads or uploads by our staff. Our preferred connectivity method is an API providing access to the actual business-message payloads, rather than transaction status information alone.

We have reviewed the supplied ALDI SOUTH Group EANCOM D.01B message implementation guidelines, including ORDERS version 2.4. To proceed with the appropriate connection setup and implementation, please confirm the following:

1. **Connectivity and entitlement:** Is API-based machine-to-machine integration supported and permitted for partner 1060776-AT-2 in this ALDI/HOFER project? If so, which OpenText service and subscription are required? Please provide the applicable API documentation, test and production endpoints, authentication requirements, and provisioning procedure. If API connectivity is unavailable, please advise which approved automated EDI transport, such as AS2 or SFTP, is available to us.

2. **Message delivery:** How can our ERP receive or retrieve the original ORDERS payloads, including amendments and cancellations? Please describe notification or polling options, message identifiers, receipt acknowledgements, redelivery, retention and retrieval limits. Please also confirm whether payloads will be delivered as EANCOM EDIFACT or through a documented alternative representation.

3. **Order-change semantics:** The ORDERS guideline specifies BGM document codes 220/230 and LIN action codes 1/2/3/4, and allows both delta and full-load changes. Which mode applies to our connection, and how is that mode identified? Please confirm version sequencing, treatment of omitted lines, and whether changed quantities represent revised totals. We would appreciate representative test messages covering an original order, an added line, a changed line, a deleted line, a complete cancellation, and closure of an outstanding quantity following a partial delivery using QTY qualifiers 27/46.

4. **Identifiers and product mapping:** Please confirm the countries and ALDI/HOFER buying entities covered by 1060776-AT-2, the required sender/receiver GLNs or EDI identifiers, and any mailbox or routing identifiers. Please also clarify the GTIN-13/GTIN-14 packaging levels and ordered quantity units applicable to our products, so that ERP carton quantities are mapped correctly.

5. **Required scope and validation:** Please confirm the message types required for our onboarding, the applicable DESADV variant, and whether INVOIC, RECADV or any technical/business acknowledgement messages are mandatory. Please provide the testing procedure, acceptance criteria, go-live deadline and any applicable setup or recurring charges. Can automated order reception be introduced as an initial phase, with the remaining message flows implemented according to an agreed schedule?

Please assign or identify the relevant technical contact and advise which tasks we should complete next in Active Intelligence. We would welcome a technical call to agree the connection method, message scope and test plan.

Partner ID: 1060776-AT-2

Onboarding User ID: 1060776-AT-2.1

Project PIN: 25347

Kind regards,

Sandor Horvath

On behalf of Gava Hungria Kft.

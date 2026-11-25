# Computer Adaptive Testing (CAT) examples

Example content packages for the [1EdTech QTI Computer Adaptive Testing (CAT) 1.0](https://www.1edtech.org/standards/cat) specification.

> **Note:** these packages are **QTI 2.2** content (`imsqti_v2p2` namespace), not QTI 3.0. A QTI 3.0 CAT example is not available yet.

| Package | Description |
|---|---|
| [CAT_Test01_Adaptive_EchoAdapt](CAT_Test01_Adaptive_EchoAdapt) | The original sample (2019). It is configured for the ACT EchoAdapt CAT engine and uses a pre-standard, temporary namespace for the adaptive selection (`http://www.taotesting.com/xsd/ais_v1p0p0`). |
| [CAT_Test01_Adaptive_CitoCat](CAT_Test01_Adaptive_CitoCat) | A copy of the EchoAdapt sample (2021), adapted for Cito's CAT engine. It uses the CAT 1.0 namespace (`https://purl.imsglobal.org/spec/cat/v1p0/schema/xsd/qtiv2-ais.xsd`), with JSON metadata and XML usage data. |

Both packages contain the same 10 items: 1 informational item, 9 scorable items across 3 difficulties and 3 topics, and 1 closing informational item. Each package folder contains the content package as a `.zip` and in unzipped form.

The CAT engine endpoints referenced in the packages are demonstration services and may no longer be available.

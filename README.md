# Ratings History (Azure Web App + Azure Functions)
This branch introduces Azure Functions to this project, aiming to enhance the modularity and performance of this application. The project is now suitable for deployment to the Azure Web Apps. The primary goal is to offload scraping functionality from the existing Express backend to serverless Azure Functions. This change allows to reduce the load on the main backend improving overall system performance.

## Agencies List
The current version covers the following agencies:
- Kroll Bond Ratings (KBRA, Kroll Bond Rating Agency, LLC)
- Fitch Ratings (Fitch Ratings, Inc.)
- Morningstar (Morningstar DBRS, Morningstar, Inc.)
- Moody's Ratings (Moody’s Investors Service, Inc.)
- Demotech (Demotech, Inc.)
- Japan Credit Ratings (Japan Credit Rating Agency, Ltd)
- Egan Jones (Egan-Jones Ratings Company)

<sub>_* This list is subject to change_</sub>

## Todo
- [x] Basic functionality
- [x] Fix Moody's Ratings download
- [x] Refactor agencies and Downloader class
- [x] Task management and queuing
- [x] Authentication for admin panel + protect endpoints with auth middleware
- [x] Direct parsing of XML files without ZIP extraction
- [x] Optimizations for better resource management
- [x] Server restart functionality
- [ ] Add more agencies
- [ ] Improve abort and cleanup logic
- [ ] General testing and debugging
- [ ] Write good readme

## References
- [Center for Municipal Finance](http://www.municipalfinance.org/)
- [Center for Corporate and Securities Law at the University of San Diego School of Law](https://www.sandiego.edu/law/centers/ccsl)
- [Rating History Files Publication Guide](https://www.sec.gov/structureddata/rocr-publication-guide#_Toc451345608)

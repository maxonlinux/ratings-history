# Ratings History
This project allows you to download credit rating data from various agencies (see the [Agencies List](#agencies-list) section) and convert it to the sorted CSV files.

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
- [ ] Authentication for admin panel + protect endpoints with auth middleware
- [ ] Add more agencies
- [x] Direct parsing of XML files without ZIP extraction
- [ ] Improve abort and cleanup logic
- [x] Optimizations for better resource management
- [x] Server restart functionality
- [ ] General testing and debugging
- [ ] Write good readme

## References
- [Center for Municipal Finance](http://www.municipalfinance.org/)
- [Center for Corporate and Securities Law at the University of San Diego School of Law](https://www.sandiego.edu/law/centers/ccsl)
- [Rating History Files Publication Guide](https://www.sec.gov/structureddata/rocr-publication-guide#_Toc451345608)

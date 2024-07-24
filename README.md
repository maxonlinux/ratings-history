# Ratings History
This project allows you to download credit rating data from various agencies (see the [Agencies List](#agencies-list) section) and convert it to the sorted CSV files.

## Agencies List
The current version covers the following agencies:
- Kroll Bond Ratings (KBRA, Kroll Bond Rating Agency, LLC)
- Fitch Ratings (Fitch Ratings, Inc.)
- Morning Star (Morningstar DBRS, Morningstar, Inc.)
- Moody's Ratings (Moody’s Investors Service, Inc.)
- Demotech (Demotech, Inc.)
- Japan Credit Ratings (Japan Credit Rating Agency, Ltd)
- Egan Jones (Egan-Jones Ratings Company)

<sub>_* This list is subject to change_</sub>

## Issues
- Duplicated lines in the output CSV files due to the critical bug in the Parser class (please, see the [issue #1](https://github.com/maxonlinux/ratings-history/issues/1)). Fixed in the `dev` branch (see commit [1e9ae37](https://github.com/maxonlinux/ratings-history/commit/1e9ae37b270376626c52716550951d8e5bbfe3c4))

## Todo
- [x] Basic functionality
- [x] Fix Moody's Ratings download
- [ ] Refactor agencies and Downloader class
- [ ] Authentication for admin panel + protect endpoints with auth middleware
- [ ] Add more agencies
- [x] Direct parsing of XML files without ZIP extraction
- [ ] Improve abort and cleanup logic
- [x] Optimizations for better resource management
- [ ] Server restart functionality
- [ ] General testing and debugging
- [ ] Write good readme

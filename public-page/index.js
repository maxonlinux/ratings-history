const http = require("http");

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/" || req.url === "/index.html") {
      const response = await fetch(
        "https://api.ratingshistory.info/api/v1/files"
      );
      const files = await response.json();

      const html = `
      <!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Rating history</title>
    <style>
      div {
        width: 800px;
        margin: 30px;
      }

      h2 {
        font: 400 40px/1.5 Helvetica, Verdana, sans-serif;
        margin: 0;
        padding: 0;
      }

      h3 {
        font: 200 20px/1.5 Helvetica, Verdana, sans-serif;
        margin: 0;
        padding: 0;
      }

      ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
      }

      li {
        font: 200 20px/1.5 Helvetica, Verdana, sans-serif;
        border-bottom: 1px solid #ccc;
      }

      li:last-child {
        border: none;
      }

      li a {
        text-decoration: none;
        color: #000;

        -webkit-transition: font-size 0.3s ease, background-color 0.3s ease;
        -moz-transition: font-size 0.3s ease, background-color 0.3s ease;
        -o-transition: font-size 0.3s ease, background-color 0.3s ease;
        -ms-transition: font-size 0.3s ease, background-color 0.3s ease;
        transition: font-size 0.3s ease, background-color 0.3s ease;
        display: block;
        width: 800px;
      }

      .text-danger {
        padding: 0;
        margin: 0;
        font: 200 20px/1.5 Helvetica, Verdana, sans-serif;
        color: #dc3545 !important;
      }
    </style>
  </head>
  <body>
    <div>
      <h2>Credit Rating Agency Ratings History Data</h2>
      <hr />
      <h3>
        Under SEC Regulation 17g-7, Nationally Recognized Statistical Rating
        Organizations (NRSRSOs) are required to report their historical rating
        assignments, upgrades, downgrades and withdrawals since 2010. The files
        must be updated monthly, formatted in XBRL and posted to each rating
        agency's website. Rating data are generally reported on a one year
        delay.
        <p>
          Because most researchers are unfamiliar with XBRL and cannot easily
          locate the history files, this valuable resource has seen limited use.
          On this web page, we provide histories from multiple agencies
          converted to CSV format - which may be directly loaded into Microsoft
          Excel or Access.
        </p>
        <p>
          The files linked below are named to denote the date provided, rating
          agency name and asset category.
        </p>
        <p></p>
        <hr />
      </h3>
      <ul>
        ${
          files.message
            ? files.message
                .map(
                  (file) => `
            <li>
                <a href="https://api.ratingshistory.info/public/${file.name}">${file.name} <span>(${file.lines} lines)</span></a>
            </li>
        `
                )
                .join("")
            : `
            <li>
              No files
            </li>`
        }
      </ul>
      <div class="text-danger"></div>
      <p></p>
      <hr />
      <h3>
        Abbreviations in these files are explained in Section 2.4 of the
        <a
          href="https://www.sec.gov/structureddata/rocr-publication-guide.html"
          target="_blank"
          >SEC's Rating History Publication Guide.</a
        >
        <p>
          Download and parsing script available on
          <a href="https://github.com/maxonlinux/ratings-history" target="_blank"
            >Github.</a
          >
        </p>
        <p></p>
        <hr />
        This resource was created by the
        <a href="http://www.municipalfinance.org/" target="_blank"
          >Center for Municipal Finance</a
        >
        with the generous support from the
        <a href="https://www.sandiego.edu/law/centers/ccsl/" target="_blank"
          >Center for Corporate and Securities Law at the University of San
          Diego School of Law.</a
        >
        <p></p>
      </h3>
      <hr />
    </div>
  </body>
</html>
`;

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Page not found");
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

const PORT = 8080;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const gradSvg = d3.select("#graduation-chart");
const gradMargin = { top: 40, right: 150, bottom: 120, left: 110 };
const gradWidth = +gradSvg.attr("width") - gradMargin.left - gradMargin.right;
const gradHeight = +gradSvg.attr("height") - gradMargin.top - gradMargin.bottom;
const gradG = gradSvg.append("g").attr("transform", `translate(${gradMargin.left},${gradMargin.top})`);

// Tooltip 생성
const gradTooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// 엑셀 파일 로드
fetch("data/순천대졸업성적.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 데이터 변환
        let processedData = sheetData
            .filter(row => row["학과명"] && row["학과(전공) 별 졸업 백분율 점수 평균"]) // 값이 없는 행 필터링
            .map(row => ({
                단과대학: row["단과대학"],
                학과명: row["학과명"],
                졸업자수: +row["졸업자 수"] || 0,
                평균점수: +row["학과(전공) 별 졸업 백분율 점수 평균"] || 0
            }))
            .filter(row => row.평균점수 > 0); // 평균 점수가 0보다 큰 경우만 포함
        
         // "융합산업학과", "물류비즈니스학과" 제거
         processedData = processedData.filter(row => row.학과명 !== "융합산업학과");
         processedData = processedData.filter(row => row.학과명 !== "물류비즈니스학과");

        // 색상 스케일
        const gradColorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(processedData.map(d => d.단과대학))]);

        // X축 및 Y축 스케일
        const gradXScale = d3.scaleBand()
            .domain(processedData.map(d => d.학과명))
            .range([0, gradWidth])
            .padding(0.2);

        const gradYScale = d3.scaleLinear()
            .domain([60,100])
            .range([gradHeight, 0]);

        // X축 및 Y축 추가
        gradG.append("g")
            .attr("transform", `translate(0, ${gradHeight})`)
            .call(d3.axisBottom(gradXScale))
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("font-size", "9px")
            .style("text-anchor", "end");

        gradG.append("g")
            .call(d3.axisLeft(gradYScale));
        
        // Y축 레이블 추가
        gradSvg.append("text")
            .attr("x", gradMargin.left / 2 - 20) // X 좌표 설정
            .attr("y", gradMargin.top / 2 -95) // Y 좌표 설정
            .attr("text-anchor", "middle")
            .attr("transform", `translate(20, ${gradHeight / 2})`)
            .style("font-size", "10px")
            .attr("fill", "#555")
            .text("(점)");

        // 막대 추가
        gradG.selectAll(".bar")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => gradXScale(d.학과명))
            .attr("y", d => gradYScale(d.평균점수))
            .attr("width", gradXScale.bandwidth())
            .attr("height", d => gradHeight - gradYScale(d.평균점수))
            .attr("fill", d => gradColorScale(d.단과대학))
            .attr("fill-opacity", 0.8)
            .on("mouseover", (event, d) => {
                gradTooltip.style("opacity", 1)
                    .html(`<strong>단과대학:</strong> ${d.단과대학}<br><strong>학과명:</strong> ${d.학과명}<br><strong>평균점수:</strong> ${d.평균점수}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                gradTooltip.style("opacity", 0);
            });

        // 범례 추가
        const gradLegend = gradSvg.append("g")
        .attr("transform", `translate(${gradWidth + 140}, ${gradMargin.top})`);

        const colleges = [...new Set(processedData.map(d => d.단과대학))];
        colleges.forEach((college, i) => {
        const legendRow = gradLegend.append("g")
            .attr("class", "legend-row")
            .attr("transform", `translate(0, ${i * 20})`)
            .on("mouseover", () => {
                gradG.selectAll(".bar")
                    .attr("fill-opacity", d => (d.단과대학 === college ? 0.8 : 0.1));
            })
            .on("mouseout", () => {
                gradG.selectAll(".bar")
                    .attr("fill-opacity", 0.8);
            });

        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", gradColorScale(college));

        legendRow.append("text")
            .attr("x", 12)
            .attr("y", 9)
            .text(college)
            .style("font-size", "9px")
            .attr("text-anchor", "start");
        });
    })
    .catch(error => {
        console.error("Error loading data:", error);
    });

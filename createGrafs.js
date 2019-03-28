const medalsBarChart = function (arr) {    
    const arrDiagram = [];    
    const square = String.fromCharCode(9632);
    const maxSquare = 200;
    
    const maxMedal = Math.max.apply(Math, arr.map((obj)=> obj.countMedals));      
    for (let i = 0; i < arr.length; i++) {
        let strSquare = '';        
        let count = Math.floor(maxSquare * arr[i].countMedals / maxMedal); 
        if (count !== 0) {
            for (let j = 0; j < count; j ++) {
                strSquare +=  square            
            }
        } 
        arrDiagram.push(`${arr[i].column}    ${strSquare}`);
    }   
    process.stdout.write(arrDiagram.join('\r\n'));

    return arrDiagram;
}


module.exports = {medalsBarChart};




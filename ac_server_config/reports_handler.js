module.exports = {
	collect
};

function collect_daily_reports(){
  fs.readFile(FACILITIES_REPORTS_PATH,function(error,data){
    console.log('parse the data');
  });
};


exports.randomElement = function(items) {

    var total = items.reduce(function (sum, item) { return sum + item.weight; }, 0);
    var rn = Math.random() * total;

    for (var item of items) {
        if (rn < item.weight) {
            return item;
        }
        rn -= item.weight;
    }
}

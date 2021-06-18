export const mapOptions = (order: any) => {
  order.Foods.forEach((currentOption: any) => {
    const _optionCustomer: any = currentOption.Options;
    const _optionRestaurant: any = currentOption.Food.Options;

    const _options: any = _optionCustomer.reduce(
      (optsCus: any, currOptCus: any) => {
        const optionDetail = _optionRestaurant.find(
          (opt: any) => currOptCus.id === opt.id
        );

        const _items = optionDetail.Items.filter((item) =>
          currOptCus.Items.find((i) => i.id === item.id)
        );

        optsCus.push({ ...optionDetail, ...currOptCus, Items: _items });
        return optsCus;
      },
      []
    );

    currentOption.Options = _options;
  });
};

export const normalOrder = (order: any) => {
  const Foods = order.Foods;

  Foods.forEach((food) => {
    food.Name = food.Food.Name;
    food.Avatar = food.Food.Avatar;
    food.id = food.Food._id;

    food.Options = food.Options.reduce(
      (prev, curr) => {
        prev.notes = `${prev.notes ? prev.notes + ". " : ""}${
          curr.Name
        }: ${curr.Items.map((item) => item.Name).join(", ")}`;

        prev.totalPrice += curr.Items.reduce(
          (total, item) => total + item.OriginalPrice,
          0
        );
        return prev;
      },
      { notes: "", totalPrice: 0 }
    );

    delete food.Food;
  });
};

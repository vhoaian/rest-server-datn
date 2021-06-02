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

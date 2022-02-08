//透過joi module來驗證使用者註冊和登入的格式是否正確
import Joi from "joi";

// Register validation
const registerValidation = (data) => {
  const shcema = Joi.object({
    username: Joi.string().min(1).max(50).required(),
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(255).required(),
  });

  return shcema.validate(data);
};

//Login validation
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(255).required(),
  });
  return schema.validate(data);
};

//fetch validation for post
const fetchPokemonValidation = (data) => {
  const schema = Joi.object({
    clientGeneration: Joi.number().min(1).max(9).required(),
  });
  return schema.validate(data);
};

//game status validation for post
const profileValidationForPost = (data) => {
  const schema = Joi.object({
    user_id: Joi.string().required(),
    game_generation: Joi.string()
      .valid("1", "2", "3", "4", "5", "6", "7", "8", "mix")
      .required(),
    game_result: Joi.string().valid("win", "lose", "draw").required(),
    game_date: Joi.date(),
  });
  return schema.validate(data);
};

//profile validation for patch
const profileValidationForPatch = (data) => {
  let validationObject = {};
  //避免User給空的request, 其實也可以在router.patch, 利用req來判斷是否沒輸入東西
  //Object.keys().length 若為0, 表示為空的object

  //避免都沒輸入
  if (Object.keys(data).length === 0) {
    let error = {
      error:
        "Either username or password is required before press 'send' button.",
    };
    return error;
  }

  //透過for in loop將req.body傳送過來的屬性作對應的constraint, 避免只輸入其中幾項導致不能更新
  //如果req.body給一個不屬於這三項的屬性值, Joi會回error message "xxx" is not allowed
  for (let atribute in data) {
    if (atribute === "username")
      validationObject[atribute] = Joi.string().min(1).max(12);
    if (atribute === "password")
      validationObject[atribute] = Joi.string().min(6).max(255);
  }
  //將原本寫死的物件改用物件變數來取代
  const schema = Joi.object(validationObject);
  return schema.validate(data);
};

//Course validation for patch
const courseValidationForPatch = (data) => {
  //透過自定義方法, 來輔助user在做patch可以只給title, description, price其中一項做更新
  let validationObject = {};
  //避免User給空的request, 其實也可以在router.patch, 利用req來判斷是否沒輸入東西
  //Object.keys().length 若為0, 表示為空的object
  if (Object.keys(data).length === 0) {
    let error = { error: "The request can't be empty" };
    return error;
  }
  //透過for in loop將req.body傳送過來的屬性作對應的constraint, 避免只輸入其中幾項導致不能更新
  //如果req.body給一個不屬於這三項的屬性值, Joi會回error message "xxx" is not allowed
  for (let atribute in data) {
    if (atribute == "title")
      validationObject[atribute] = Joi.string().min(6).max(50).required();
    if (atribute == "description")
      validationObject[atribute] = Joi.string().min(6).max(50).required();
    if (atribute == "price")
      validationObject[atribute] = Joi.number().min(10).max(9999).required();
  }
  //將原本寫死的物件改用物件變數來取代
  const schema = Joi.object(validationObject);
  return schema.validate(data);
};

//驗證密碼的格式
const passwordValidation = (data) => {
  const schema = Joi.object({
    password: Joi.string().min(6).max(255).required(),
  });
  return schema.validate(data);
};

export {
  registerValidation,
  loginValidation,
  fetchPokemonValidation,
  profileValidationForPost,
  profileValidationForPatch,
  courseValidationForPatch,
  passwordValidation,
};

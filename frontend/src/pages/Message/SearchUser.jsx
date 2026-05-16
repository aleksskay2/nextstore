import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from './SearchUser.module.css'

// export default function SearchUser() {
//     const [query, setQuery] = useState("");
//     const [results, setResults] = useState([]);
//     const navigate = useNavigate();



//     const handleSearch = async (e) => {
//         setQuery(e.target.value);

//         if (e.target.value.trim().length < 2) {
//             setResults([]);
//             return;
//         }
//         try {
//                                         //  http://127.0.0.1:8000/api/products/?limit=20&offset=20
//             const res = await api.get(`search-user/?q=${e.target.value}`);
//             setResults(res.data);
//             console.log('res in SearchUser', res.data)
//         }
//         catch (error) {
//             console.log('Ошибка поиска пользователей', error)
//         }
       
//     };



//     return (
//         <div  className={styles["search-user"]} >
//             <input
//                 type="text"
//                 placeholder="Поиск по пользователям..."
//                 value={query}
//                 onChange={handleSearch}
//                 className={styles["search-user__name"]}
//             />

//             {results && results.map((user) => (
//                 <div
//                     key={user.id}
//                     // onClick={() => navigate(`/chat/private/${user.id}`)}
//                     // navigate(`/user/${user.id}`);
//                     onClick={() => navigate(`/user/${user.id}`)}
//                     style={{
//                         display: "flex",
//                         alignItems: "center",
//                         cursor: "pointer",
//                         padding: "10px",
//                         borderBottom: "1px solid #eee"
//                     }}
//                 >
//                     <img
//                         src={user.avatar || "/no-avatar.png"}
//                         alt=""
//                         width={40}
//                         height={40}
//                         style={{ borderRadius: "50%", marginRight: "20px" }}
//                     />
//                     <span>{user.username}</span>
//                 </div>
//             ))}
//         </div>
//     );
// }






// export default function Search() {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [mode, setMode] = useState("users"); // users | groups
//   const navigate = useNavigate();

//   const handleSearch = async (e) => {
//     const value = e.target.value;
//     setQuery(value);

//     if (value.trim().length < 2) {
//       setResults([]);
//       return;
//     }

//     try {
//       const url =
//         mode === "users"
//           ? `/search-user/?q=${value}`
//           : `/search-groups/?q=${value}`;

//       const res = await api.get(url);
//       setResults(res.data);
//     } catch (err) {
//       console.error("Ошибка поиска:", err);
//     }
//   };

//   return (
//     <div className={styles["search-user"]}>
      
//       {/* 🔘 Переключатель */}
//       <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
//         <label style={{ cursor: "pointer" }}>
//           <input
//             type="radio"
//             checked={mode === "users"}
//             onChange={() => {
//               setMode("users");
//               setResults([]);
//               setQuery("");
//             }}
//           />{" "}
//           Пользователи
//         </label>

//         <label style={{ cursor: "pointer" }}>
//           <input
//             type="radio"
//             checked={mode === "groups"}
//             onChange={() => {
//               setMode("groups");
//               setResults([]);
//               setQuery("");
//             }}
//           />{" "}
//           Группы
//         </label>
//       </div>

//       {/* 🔍 Input */}
//       <input
//         type="text"
//         placeholder={
//           mode === "users"
//             ? "Поиск пользователей..."
//             : "Поиск групп..."
//         }
//         value={query}
//         onChange={handleSearch}
//         className={styles["search-user__name"]}
//       />

//       {/* 📋 Результаты */}
//       {results.map((item) =>
//         mode === "users" ? (
//           <div
//             key={item.id}
//             onClick={() => navigate(`/user/${item.id}`)}
//             className={styles["search-user__item"]}
//           >
//             <img
//               src={item.avatar || "/no-avatar.png"}
//               alt=""
//               width={40}
//               height={40}
//               style={{ borderRadius: "50%", marginRight: 16 }}
//             />
//             <span>{item.username}</span>
//           </div>
//         ) : (
//           <div
//             key={item.id}
//             onClick={() => navigate(`/groups/${item.id}`)}
//             className={styles["search-user__item"]}
//           >
//             <img
//               src={item.avatar || "/group-default.png"}
//               alt=""
//               width={40}
//               height={40}
//               style={{ borderRadius: "50%", marginRight: 16 }}
//             />
//             <div>
//               <div style={{ fontWeight: 600 }}>
//                 {item.title} {item.is_private && "🔒"}
//               </div>
//               <div style={{ fontSize: 12, color: "#666" }}>
//                 {item.members_count} участников
//               </div>
//             </div>
//           </div>
//         )
//       )}
//     </div>
//   );
// }





import { useGroupsStore} from "../../../src/components/store/groups.store"
// ...

export default function Search() {
  const { setActiveGroup, groups, setGroups , setMembersCount, activeGroup} = useGroupsStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState("users"); // users | groups
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      const url =
        mode === "users"
          ? `/search-user/?q=${value}`
          : `/search-groups/?q=${value}`;

      const res = await api.get(url);
      setResults(res.data);
      console.log('groups -  ', res.data)
     
      // обновляем локальный store групп, чтобы выбрать из него
      if (mode === "groups") {
        setGroups(res.data);
        
        
      }
    } catch (err) {
      console.error("Ошибка поиска:", err);
    }
  };


    const handleGroupClick = (group) => {
        setActiveGroup(group); 
        alert(activeGroup)  
        setMembersCount(group.members_count);
        console.log('res.data.members - ', group.members_count)
        // обновляем состояние
        navigate(`/groups/${group.id}`); // переходим на страницу группы
    };

    

useEffect(() => {
  console.log("activeGroup updated:", activeGroup);
}, []);


  return (

    
    // <div className={styles["search-user"]}>
    //   {/* переключатель */}
    //   <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
    //     <label style={{ cursor: "pointer" }}>
    //       <input
    //         type="radio"
    //         checked={mode === "users"}
    //         onChange={() => {
    //           setMode("users");
    //           setResults([]);
    //           setQuery("");
    //         }}
    //       />{" "}
    //       Пользователи
    //     </label>

    //     <label style={{ cursor: "pointer" }}>
    //       <input
    //         type="radio"
    //         checked={mode === "groups"}
    //         onChange={() => {
    //           setMode("groups");
    //           setResults([]);
    //           setQuery("");
    //         }}
    //       />{" "}
    //       Группы
    //     </label>
    //   </div>

    //   {/* input */}
    //   <input
    //     type="text"
    //     placeholder={mode === "users" ? "Поиск пользователей..." : "Поиск групп..."}
    //     value={query}
    //     onChange={handleSearch}
    //     className={styles["search-user__name"]}
    //   />

    //   {/* результаты */}
    //   {results.map((item) =>
    //     mode === "users" ? (
    //       <div
    //         key={item.id}
    //         onClick={() => navigate(`/user/${item.id}`)}
    //         className={styles["search-user__item"]}
    //       >
    //         <img
    //           src={item.avatar || "/no-avatar.png"}
    //           alt=""
    //           width={40}
    //           height={40}
    //           style={{ borderRadius: "50%", marginRight: 16 }}
    //         />
    //         <span>{item.username}</span>
    //       </div>
    //     ) : (
    //       <div
    //         key={item.id}
    //         onClick={() => handleGroupClick(item) } // <-- устанавливаем активную группу
    //         className={styles["search-user__item"]}
    //       >
    //         <img
    //           src={item.avatar || "/group-default.png"}
    //           alt=""
    //           width={40}
    //           height={40}
    //           style={{ borderRadius: "50%", marginRight: 16 }}
    //         />
    //         <div>
    //           <div style={{ fontWeight: 600 }}>
    //             {item.title} {item.is_private && "🔒"}
    //           </div>
    //           <div style={{ fontSize: 12, color: "#666" }}>
    //             {item.members_count} участников
    //           </div>
    //         </div>
    //       </div>
    //     )
    //   )}
    // </div>



    <div className={styles.searchContainer}>
  {/* Красивый переключатель режимов (Tabs) */}
  <div className={styles.modeToggle}>
    <button
      className={`${styles.toggleBtn} ${mode === "users" ? styles.active : ""}`}
      onClick={() => { setMode("users"); setResults([]); setQuery(""); }}
    >
      Пользователи
    </button>
    <button
      className={`${styles.toggleBtn} ${mode === "groups" ? styles.active : ""}`}
      onClick={() => { setMode("groups"); setResults([]); setQuery(""); }}
    >
      Группы
    </button>
  </div>

  {/* Поле поиска */}
  <div className={styles.inputWrapper}>
    <input
      type="text"
      placeholder={mode === "users" ? "Поиск пользователей..." : "Поиск групп..."}
      value={query}
      onChange={handleSearch}
      className={styles.searchInput}
    />
  </div>

  {/* Выпадающий список результатов */}
  {results.length > 0 && (
    <div className={styles.resultsList}>
      {results.map((item) => (
        <div
          key={item.id}
          className={styles.resultItem}
          onClick={() => mode === "users" ? navigate(`/user/${item.id}`) : handleGroupClick(item)}
        >
          <img
            src={item.avatar || (mode === "users" ? "/no-avatar.png" : "/group-default.png")}
            alt="avatar"
            className={styles.resultAvatar}
          />
          <div className={styles.resultInfo}>
            <span className={styles.resultTitle}>
              {mode === "users" ? item.username : item.title}
              {mode === "groups" && item.is_private && " 🔒"}
            </span>
            {mode === "groups" && (
              <span className={styles.resultSubtitle}>{item.members_count} участников</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>




  );
}

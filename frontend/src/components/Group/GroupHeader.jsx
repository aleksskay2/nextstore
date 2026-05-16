// const GroupHeader = () => {

//     return (
//         <div>

//         </div>
//     )
// }

// export default GroupHeader;

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import React from "react";
import { useGroupsStore } from "../store/groups.store";
import styles from "./GroupHeader.module.css";
import thre_dots from "../../assets/icons/three_dots.png";
import { useAppStore } from "../store/appStore";


const GroupHeader = React.memo(function GroupHeader({
    group,
    onJoin,
    userName,
}) {
    //   const members = group.members_count; // если берёшь из API

    const { user, isUserLoaded } = useAppStore();

    let isMember = false;

    useEffect(() => {
        if (!user) return;
        isMember = group.members_ids?.includes(user.id);
        console.log("user.id ", user.id);
        console.log("isMember ", isMember);
        console.log(" group.members_ids ", group);
    }, [user]);

    const selectedMessage = useGroupsStore((s) => s.selectedMessage);

    const membersCount = useGroupsStore((s) => s.membersCount);
    const navigate = useNavigate();

    const open = useGroupsStore((s) => s.openReadedLists);
    console.log("open", open);

    const readByUsers = useMemo(() => {
        if (!selectedMessage) return [];
        return (
            selectedMessage.read_by_users?.filter((u) => u !== userName) || []
        );
    }, [selectedMessage, userName]);

    console.log("selectedMessage", selectedMessage);

    // console.log('userName', userName)

    // useEffect(() => {
    //     // console.log('group in GroupHeader - ', group)
    // }, [])

    if (group.is_private) return null;

    if (group.is_member) {
        return <div className="text-green-600">Вы участник группы</div>;
    }

    return (
        <div className={styles["group-header"]}>
          <div  onClick={() => navigate(`/groups/${group.id}/members`)} className={styles["group-header__container"]} >

            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.title}
                width={40}
                height={40}
              />
            ) : (
              <div>
                {/* {group.title.toUpperCase()} */}
              </div>
            )}

            {
              (group.is_private && isMember) && (
                <button onClick={onJoin} className={styles["join-btn"]}>
                    Присоединиться
                </button>
              )
            }

            <div   className={styles["group-header__top"]}>
              <div

              className={styles["group-header__title"]}>{group.title}</div>

              <div className={styles["group-header__count"]} >
                <span>{membersCount} участников</span>
              </div>
            </div>

              <div
              className={styles["group-header__three_dots"]}> ⋮
          {open && selectedMessage && (
          <div className={styles["group-header__read-by-popup"]}>
            <strong>Прочитали:</strong>

            {readByUsers?.length ? (
              readByUsers.map((u, i) => (
                <div key={i}>{u}</div>
              ))
            ) : (
              <div>Еще не прочитано</div>
            )}
          </div>
        )}
            </div>

          </div>

        </div>
    );
});

export default GroupHeader;
